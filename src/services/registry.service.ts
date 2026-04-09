import bs58 from "bs58";
import nacl from "tweetnacl";
import { registryRepository } from "../repositories/registry.repository";
import { HttpError } from "../types/api.types";
import {
  RegisterSubNameInput,
  RegisterTopLevelInput,
  SubNameRegistration,
  TopLevelRegistration,
  TransferOwnershipInput,
  VerifyPdaInput,
} from "../types/registry.types";
import {
  derivePdaFromSeeds,
  deriveSubNamePda,
  deriveTopLevelPda,
} from "../utils/pda";
import {
  validatePublicKeyOrThrow,
  validateRequiredStringFields,
} from "../utils/validators";

class RegistryService {
  registerTopLevel(input: RegisterTopLevelInput): TopLevelRegistration {
    validateRequiredStringFields(input as unknown as Record<string, unknown>, [
      "name",
      "programId",
      "owner",
    ]);
    validatePublicKeyOrThrow(input.programId, "programId");
    validatePublicKeyOrThrow(input.owner, "owner");

    if (registryRepository.findTopLevelByProgramAndName(input.programId, input.name)) {
      throw new HttpError(409, "Name already registered for this programId");
    }

    let derived;
    try {
      derived = deriveTopLevelPda(input.programId, input.name);
    } catch {
      throw new HttpError(400, "Failed to derive PDA");
    }

    const registration: TopLevelRegistration = {
      id: registryRepository.generateId(),
      name: input.name,
      programId: input.programId,
      pda: derived.pda,
      owner: input.owner,
      bump: derived.bump,
      createdAt: new Date().toISOString(),
      parentPda: null,
    };

    return registryRepository.add(registration) as TopLevelRegistration;
  }

  resolveTopLevel(programId: string, name: string): TopLevelRegistration {
    const registration = registryRepository.findTopLevelByProgramAndName(programId, name);
    if (!registration) {
      throw new HttpError(404, "Name not found");
    }
    return registration;
  }

  registerSubName(input: RegisterSubNameInput): SubNameRegistration {
    validateRequiredStringFields(input as unknown as Record<string, unknown>, [
      "parentName",
      "subName",
      "programId",
      "owner",
    ]);
    validatePublicKeyOrThrow(input.programId, "programId");
    validatePublicKeyOrThrow(input.owner, "owner");

    const parent = registryRepository.findTopLevelByProgramAndName(
      input.programId,
      input.parentName,
    );
    if (!parent) {
      throw new HttpError(404, "Parent name not found");
    }

    if (
      registryRepository.findSubByProgramParentPdaAndName(
        input.programId,
        parent.pda,
        input.subName,
      )
    ) {
      throw new HttpError(409, "Sub-name already exists under this parent");
    }

    let derived;
    try {
      derived = deriveSubNamePda(input.programId, parent.pda, input.subName);
    } catch {
      throw new HttpError(400, "Failed to derive PDA");
    }

    const registration: SubNameRegistration = {
      id: registryRepository.generateId(),
      name: input.subName,
      parentName: parent.name,
      parentPda: parent.pda,
      programId: input.programId,
      pda: derived.pda,
      owner: input.owner,
      bump: derived.bump,
      createdAt: new Date().toISOString(),
    };

    return registryRepository.add(registration) as SubNameRegistration;
  }

  resolveSubName(
    programId: string,
    parentName: string,
    subName: string,
  ): SubNameRegistration {
    const parent = registryRepository.findTopLevelByProgramAndName(
      programId,
      parentName,
    );
    if (!parent) {
      throw new HttpError(404, "Name not found");
    }

    const registration = registryRepository.findSubByProgramParentPdaAndName(
      programId,
      parent.pda,
      subName,
    );
    if (!registration) {
      throw new HttpError(404, "Name not found");
    }

    return registration;
  }

  transferOwnership(input: TransferOwnershipInput): TopLevelRegistration {
    validateRequiredStringFields(input as unknown as Record<string, unknown>, [
      "programId",
      "name",
      "newOwner",
      "signature",
      "message",
    ]);
    validatePublicKeyOrThrow(input.newOwner, "newOwner");

    const expectedMessage = `transfer:${input.name}:to:${input.newOwner}`;
    if (input.message !== expectedMessage) {
      throw new HttpError(
        400,
        'Invalid message format. Expected: "transfer:<name>:to:<newOwner>"',
      );
    }

    const registration = registryRepository.findTopLevelByProgramAndName(
      input.programId,
      input.name,
    );
    if (!registration) {
      throw new HttpError(404, "Name not found");
    }

    try {
      const messageBytes = Buffer.from(input.message, "utf-8");
      const signatureBytes = bs58.decode(input.signature);
      const ownerPublicKeyBytes = bs58.decode(registration.owner);
      const validSignature = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        ownerPublicKeyBytes,
      );

      if (!validSignature) {
        throw new HttpError(403, "Invalid signature");
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(403, "Invalid signature");
    }

    registration.owner = input.newOwner;
    return registration;
  }

  verifyPda(input: VerifyPdaInput): {
    valid: boolean;
    expectedPda: string;
    bump: number;
  } {
    const { address, programId, seeds } = input;

    if (!address || !programId || !seeds) {
      throw new HttpError(
        400,
        "Missing required fields: address, programId, seeds",
      );
    }

    if (typeof address !== "string" || typeof programId !== "string") {
      throw new HttpError(400, "address and programId must be strings");
    }

    if (!Array.isArray(seeds)) {
      throw new HttpError(400, "seeds must be an array");
    }

    validatePublicKeyOrThrow(programId, "programId");
    validatePublicKeyOrThrow(address, "address");

    for (let i = 0; i < seeds.length; i += 1) {
      if (typeof seeds[i] !== "string") {
        throw new HttpError(400, `Seed at index ${i} must be a string`);
      }
    }

    let derived;
    try {
      derived = derivePdaFromSeeds(programId, seeds);
    } catch {
      throw new HttpError(400, "Failed to derive PDA");
    }

    return {
      valid: derived.expectedPda === address,
      expectedPda: derived.expectedPda,
      bump: derived.bump,
    };
  }

  listTopLevel(programId: string, owner?: string): TopLevelRegistration[] {
    return registryRepository.listTopLevel(programId, owner);
  }

  listSubNames(programId: string, parentName: string): SubNameRegistration[] {
    const parent = registryRepository.findTopLevelByProgramAndName(
      programId,
      parentName,
    );
    if (!parent) {
      throw new HttpError(404, "Parent name not found");
    }

    return registryRepository.listSubsByParentPda(parent.pda);
  }
}

export const registryService = new RegistryService();
