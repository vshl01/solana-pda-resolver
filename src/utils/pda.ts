import { PublicKey } from "@solana/web3.js";

export function deriveTopLevelPda(programId: string, name: string): {
  pda: string;
  bump: number;
} {
  const programPublicKey = new PublicKey(programId);
  const seeds = [Buffer.from("name"), Buffer.from(name)];
  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programPublicKey);
  return { pda: pda.toBase58(), bump };
}

export function deriveSubNamePda(
  programId: string,
  parentPda: string,
  subName: string,
): { pda: string; bump: number } {
  const programPublicKey = new PublicKey(programId);
  const parentPublicKey = new PublicKey(parentPda);
  const seeds = [
    Buffer.from("sub"),
    parentPublicKey.toBuffer(),
    Buffer.from(subName),
  ];
  const [pda, bump] = PublicKey.findProgramAddressSync(seeds, programPublicKey);
  return { pda: pda.toBase58(), bump };
}

export function derivePdaFromSeeds(
  programId: string,
  seeds: string[],
): { expectedPda: string; bump: number } {
  const programPublicKey = new PublicKey(programId);
  const seedBuffers = seeds.map((seed) => Buffer.from(seed, "utf-8"));
  const [expectedPda, bump] = PublicKey.findProgramAddressSync(
    seedBuffers,
    programPublicKey,
  );

  return { expectedPda: expectedPda.toBase58(), bump };
}
