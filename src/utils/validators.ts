import bs58 from "bs58";
import { HttpError } from "../types/api.types";

export function isValidPublicKey(key: string): boolean {
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

export function validateRequiredStringFields(
  body: Record<string, unknown>,
  fields: string[],
): void {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null) {
      throw new HttpError(400, `Missing required field: ${field}`);
    }
    if (typeof value !== "string") {
      throw new HttpError(400, `Field ${field} must be a string`);
    }
    if (value.trim().length === 0) {
      throw new HttpError(400, `Field ${field} cannot be empty`);
    }
  }
}

export function validatePublicKeyOrThrow(value: string, fieldName: string): void {
  if (!isValidPublicKey(value)) {
    throw new HttpError(
      400,
      `Invalid ${fieldName}: must be a valid base58-encoded 32-byte public key`,
    );
  }
}
