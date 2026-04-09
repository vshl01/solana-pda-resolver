import express, { Request, Response } from "express";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

const app = express();
app.use(express.json());

// ============================================================================
// Types & Data Storage
// ============================================================================

interface TopLevelRegistration {
  id: string;
  name: string;
  programId: string;
  pda: string;
  owner: string;
  bump: number;
  createdAt: string;
  parentPda: null; // Marker to distinguish from sub-names
}

interface SubNameRegistration {
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

type Registration = TopLevelRegistration | SubNameRegistration;

// In-memory storage
const registrations: Registration[] = [];
let nextId = 1;

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates if a string is a valid base58-encoded 32-byte Solana public key
 */
function isValidPublicKey(key: string): boolean {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return false;
  }

  try {
    const decoded = bs58.decode(key);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Validates required fields and types
 */
function validateRequiredFields(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
    if (typeof body[field] !== "string") {
      return `Field ${field} must be a string`;
    }
    if (body[field].trim().length === 0) {
      return `Field ${field} cannot be empty`;
    }
  }
  return null;
}

/**
 * Creates a unique identifier for top-level name lookup
 */
function getTopLevelKey(programId: string, name: string): string {
  return `${programId}:${name}`;
}

/**
 * Creates a unique identifier for sub-name lookup
 */
function getSubNameKey(
  programId: string,
  parentPda: string,
  subName: string,
): string {
  return `${programId}:${parentPda}:${subName}`;
}

// ============================================================================
// Endpoint: POST /api/registry/register
// Register a top-level name
// ============================================================================

app.post("/api/registry/register", (req: Request, res: Response) => {
  const { name, programId, owner } = req.body;

  // Validate required fields
  const fieldError = validateRequiredFields(req.body, [
    "name",
    "programId",
    "owner",
  ]);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  }

  // Validate name is not empty (after trim)
  if (name.trim().length === 0) {
    return res.status(400).json({ error: "Name cannot be empty" });
  }

  // Validate programId
  if (!isValidPublicKey(programId)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid programId: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Validate owner
  if (!isValidPublicKey(owner)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid owner: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Check if name already registered for this programId
  const key = getTopLevelKey(programId, name);
  const existing = registrations.find(
    (r) =>
      "parentPda" in r &&
      r.parentPda === null &&
      r.programId === programId &&
      r.name === name,
  );

  if (existing) {
    return res
      .status(409)
      .json({ error: "Name already registered for this programId" });
  }

  // Derive PDA
  let pda: PublicKey;
  let bump: number;

  try {
    const programPublicKey = new PublicKey(programId);
    const seeds = [Buffer.from("name"), Buffer.from(name)];
    [pda, bump] = PublicKey.findProgramAddressSync(seeds, programPublicKey);
  } catch (error) {
    return res.status(400).json({ error: "Failed to derive PDA" });
  }

  // Create registration
  const registration: TopLevelRegistration = {
    id: String(nextId++),
    name,
    programId,
    pda: pda.toBase58(),
    owner,
    bump,
    createdAt: new Date().toISOString(),
    parentPda: null,
  };

  registrations.push(registration);

  return res.status(201).json(registration);
});

// ============================================================================
// Endpoint: GET /api/registry/resolve/:programId/:name
// Resolve name to PDA
// ============================================================================

app.get(
  "/api/registry/resolve/:programId/:name",
  (req: Request, res: Response) => {
    const { programId, name } = req.params;

    const registration = registrations.find(
      (r) =>
        "parentPda" in r &&
        r.parentPda === null &&
        r.programId === programId &&
        r.name === name,
    ) as TopLevelRegistration | undefined;

    if (!registration) {
      return res.status(404).json({ error: "Name not found" });
    }

    return res.status(200).json(registration);
  },
);

// ============================================================================
// Endpoint: POST /api/registry/sub/register
// Register a sub-name under an existing parent
// ============================================================================

app.post("/api/registry/sub/register", (req: Request, res: Response) => {
  const { parentName, subName, programId, owner } = req.body;

  // Validate required fields
  const fieldError = validateRequiredFields(req.body, [
    "parentName",
    "subName",
    "programId",
    "owner",
  ]);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  }

  // Validate subName is not empty
  if (subName.trim().length === 0) {
    return res.status(400).json({ error: "subName cannot be empty" });
  }

  // Validate programId
  if (!isValidPublicKey(programId)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid programId: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Validate owner
  if (!isValidPublicKey(owner)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid owner: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Look up parent (top-level only)
  const parent = registrations.find(
    (r) =>
      "parentPda" in r &&
      r.parentPda === null &&
      r.programId === programId &&
      r.name === parentName,
  ) as TopLevelRegistration | undefined;

  if (!parent) {
    return res.status(404).json({ error: "Parent name not found" });
  }

  // Check if sub-name already exists under this parent
  const existing = registrations.find(
    (r) =>
      "parentPda" in r &&
      r.parentPda !== null &&
      (r as SubNameRegistration).parentPda === parent.pda &&
      (r as SubNameRegistration).programId === programId &&
      r.name === subName,
  );

  if (existing) {
    return res
      .status(409)
      .json({ error: "Sub-name already exists under this parent" });
  }

  // Derive PDA for sub-name
  let pda: PublicKey;
  let bump: number;

  try {
    const programPublicKey = new PublicKey(programId);
    const parentPdaPublicKey = new PublicKey(parent.pda);
    const seeds = [
      Buffer.from("sub"),
      parentPdaPublicKey.toBuffer(),
      Buffer.from(subName),
    ];
    [pda, bump] = PublicKey.findProgramAddressSync(seeds, programPublicKey);
  } catch (error) {
    return res.status(400).json({ error: "Failed to derive PDA" });
  }

  // Create sub-name registration
  const registration: SubNameRegistration = {
    id: String(nextId++),
    name: subName,
    parentName: parent.name,
    parentPda: parent.pda,
    programId,
    pda: pda.toBase58(),
    owner,
    bump,
    createdAt: new Date().toISOString(),
  };

  registrations.push(registration);

  return res.status(201).json(registration);
});

// ============================================================================
// Endpoint: GET /api/registry/sub/resolve/:programId/:parentName/:subName
// Resolve sub-name
// ============================================================================

app.get(
  "/api/registry/sub/resolve/:programId/:parentName/:subName",
  (req: Request, res: Response) => {
    const { programId, parentName, subName } = req.params;

    // First find the parent
    const parent = registrations.find(
      (r) =>
        "parentPda" in r &&
        r.parentPda === null &&
        r.programId === programId &&
        r.name === parentName,
    ) as TopLevelRegistration | undefined;

    if (!parent) {
      return res.status(404).json({ error: "Name not found" });
    }

    // Find the sub-name
    const registration = registrations.find(
      (r) =>
        "parentPda" in r &&
        r.parentPda !== null &&
        (r as SubNameRegistration).parentPda === parent.pda &&
        (r as SubNameRegistration).programId === programId &&
        r.name === subName,
    ) as SubNameRegistration | undefined;

    if (!registration) {
      return res.status(404).json({ error: "Name not found" });
    }

    return res.status(200).json(registration);
  },
);

// ============================================================================
// Endpoint: POST /api/registry/transfer
// Transfer name ownership with signature verification
// ============================================================================

app.post("/api/registry/transfer", (req: Request, res: Response) => {
  const { programId, name, newOwner, signature, message } = req.body;

  // Validate required fields
  const fieldError = validateRequiredFields(req.body, [
    "programId",
    "name",
    "newOwner",
    "signature",
    "message",
  ]);
  if (fieldError) {
    return res.status(400).json({ error: fieldError });
  }

  // Validate newOwner
  if (!isValidPublicKey(newOwner)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid newOwner: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Validate message format
  const expectedMessage = `transfer:${name}:to:${newOwner}`;
  if (message !== expectedMessage) {
    return res
      .status(400)
      .json({
        error: `Invalid message format. Expected: "transfer:<name>:to:<newOwner>"`,
      });
  }

  // Find the registration (check top-level only, based on requirements)
  const registration = registrations.find(
    (r) =>
      "parentPda" in r &&
      r.parentPda === null &&
      r.programId === programId &&
      r.name === name,
  );

  if (!registration) {
    return res.status(404).json({ error: "Name not found" });
  }

  // Verify signature
  try {
    const messageBytes = Buffer.from(message, "utf-8");
    const signatureBytes = bs58.decode(signature);
    const ownerPublicKeyBytes = bs58.decode(registration.owner);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      ownerPublicKeyBytes,
    );

    if (!isValid) {
      return res.status(403).json({ error: "Invalid signature" });
    }
  } catch (error) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  // Update owner
  registration.owner = newOwner;

  return res.status(200).json(registration);
});

// ============================================================================
// Endpoint: POST /api/registry/verify
// Verify a PDA derivation
// ============================================================================

app.post("/api/registry/verify", (req: Request, res: Response) => {
  const { address, programId, seeds } = req.body;

  // Validate required fields
  if (!address || !programId || !seeds) {
    return res
      .status(400)
      .json({ error: "Missing required fields: address, programId, seeds" });
  }

  if (typeof address !== "string" || typeof programId !== "string") {
    return res
      .status(400)
      .json({ error: "address and programId must be strings" });
  }

  if (!Array.isArray(seeds)) {
    return res.status(400).json({ error: "seeds must be an array" });
  }

  // Validate programId
  if (!isValidPublicKey(programId)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid programId: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Validate address
  if (!isValidPublicKey(address)) {
    return res
      .status(400)
      .json({
        error:
          "Invalid address: must be a valid base58-encoded 32-byte public key",
      });
  }

  // Validate seeds are all strings
  for (let i = 0; i < seeds.length; i++) {
    if (typeof seeds[i] !== "string") {
      return res
        .status(400)
        .json({ error: `Seed at index ${i} must be a string` });
    }
  }

  // Derive PDA
  let expectedPda: PublicKey;
  let bump: number;

  try {
    const programPublicKey = new PublicKey(programId);
    const seedBuffers = seeds.map((seed: string) => Buffer.from(seed, "utf-8"));
    [expectedPda, bump] = PublicKey.findProgramAddressSync(
      seedBuffers,
      programPublicKey,
    );
  } catch (error) {
    return res.status(400).json({ error: "Failed to derive PDA" });
  }

  const valid = expectedPda.toBase58() === address;

  return res.status(200).json({
    valid,
    expectedPda: expectedPda.toBase58(),
    bump,
  });
});

// ============================================================================
// Endpoint: GET /api/registry/list/:programId
// List all top-level names for a program
// ============================================================================

app.get("/api/registry/list/:programId", (req: Request, res: Response) => {
  const { programId } = req.params;
  const { owner } = req.query;

  let results = registrations.filter(
    (r) =>
      "parentPda" in r && r.parentPda === null && r.programId === programId,
  );

  // Apply owner filter if provided
  if (owner && typeof owner === "string") {
    results = results.filter((r) => r.owner === owner);
  }

  return res.status(200).json(results);
});

// ============================================================================
// Endpoint: GET /api/registry/list/:programId/:name/subs
// List sub-names of a parent
// ============================================================================

app.get(
  "/api/registry/list/:programId/:name/subs",
  (req: Request, res: Response) => {
    const { programId, name } = req.params;

    // Find the parent
    const parent = registrations.find(
      (r) =>
        "parentPda" in r &&
        r.parentPda === null &&
        r.programId === programId &&
        r.name === name,
    ) as TopLevelRegistration | undefined;

    if (!parent) {
      return res.status(404).json({ error: "Parent name not found" });
    }

    // Find all sub-names
    const subs = registrations.filter(
      (r) =>
        "parentPda" in r &&
        r.parentPda !== null &&
        (r as SubNameRegistration).parentPda === parent.pda,
    );

    return res.status(200).json(subs);
  },
);

// ============================================================================
// Server Startup
// ============================================================================

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
