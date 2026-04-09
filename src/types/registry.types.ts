export interface TopLevelRegistration {
  id: string;
  name: string;
  programId: string;
  pda: string;
  owner: string;
  bump: number;
  createdAt: string;
  parentPda: null;
}

export interface SubNameRegistration {
  id: string;
  name: string;
  parentName: string;
  parentPda: string;
  programId: string;
  pda: string;
  owner: string;
  bump: number;
  createdAt: string;
}

export type Registration = TopLevelRegistration | SubNameRegistration;

export interface RegisterTopLevelInput {
  name: string;
  programId: string;
  owner: string;
}

export interface RegisterSubNameInput {
  parentName: string;
  subName: string;
  programId: string;
  owner: string;
}

export interface TransferOwnershipInput {
  programId: string;
  name: string;
  newOwner: string;
  signature: string;
  message: string;
}

export interface VerifyPdaInput {
  address: string;
  programId: string;
  seeds: string[];
}
