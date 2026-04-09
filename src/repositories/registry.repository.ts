import {
  Registration,
  SubNameRegistration,
  TopLevelRegistration,
} from "../types/registry.types";

class RegistryRepository {
  private registrations: Registration[] = [];

  private nextId = 1;

  generateId(): string {
    return String(this.nextId++);
  }

  add(registration: Registration): Registration {
    this.registrations.push(registration);
    return registration;
  }

  findTopLevelByProgramAndName(
    programId: string,
    name: string,
  ): TopLevelRegistration | undefined {
    return this.registrations.find(
      (entry): entry is TopLevelRegistration =>
        entry.parentPda === null &&
        entry.programId === programId &&
        entry.name === name,
    );
  }

  findSubByProgramParentPdaAndName(
    programId: string,
    parentPda: string,
    subName: string,
  ): SubNameRegistration | undefined {
    return this.registrations.find(
      (entry): entry is SubNameRegistration =>
        entry.parentPda !== null &&
        entry.programId === programId &&
        entry.parentPda === parentPda &&
        entry.name === subName,
    );
  }

  listTopLevel(programId: string, owner?: string): TopLevelRegistration[] {
    return this.registrations.filter(
      (entry): entry is TopLevelRegistration =>
        entry.parentPda === null &&
        entry.programId === programId &&
        (!owner || entry.owner === owner),
    );
  }

  listSubsByParentPda(parentPda: string): SubNameRegistration[] {
    return this.registrations.filter(
      (entry): entry is SubNameRegistration =>
        entry.parentPda !== null && entry.parentPda === parentPda,
    );
  }
}

export const registryRepository = new RegistryRepository();
