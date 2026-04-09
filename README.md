# Solana PDA Registry API

A TypeScript + Express REST API for managing top-level names and sub-names as deterministic Solana PDAs.

## What This Project Does

This service provides a registry model where:

- A **top-level name** (example: `alice`) is registered for a `programId`.
- A **sub-name** (example: `wallet`) is registered under a parent name (`alice` -> `wallet`).
- Every registration derives and stores a deterministic Solana PDA + bump.
- Ownership transfer of top-level names is protected by ed25519 signature verification.
- PDA verification endpoint checks whether a provided address matches derived seeds.

Storage is in-memory for simplicity. It is ideal for assignment/testing environments and can be swapped with a database later.

## Tech Stack

- Node.js + TypeScript
- Express
- `@solana/web3.js` for PDA derivation
- `tweetnacl` + `bs58` for signature verification

## Folder Structure

```txt
.
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── config
│   │   └── env.ts
│   ├── controllers
│   │   └── registry.controller.ts
│   ├── repositories
│   │   └── registry.repository.ts
│   ├── routes
│   │   └── registry.routes.ts
│   ├── services
│   │   └── registry.service.ts
│   ├── types
│   │   ├── api.types.ts
│   │   └── registry.types.ts
│   └── utils
│       ├── pda.ts
│       └── validators.ts
├── IMPLEMENTATION.md
├── TEST_CASES.md
├── package.json
└── tsconfig.json
```

## Layered Architecture

- `routes`: maps HTTP routes to controller handlers.
- `controllers`: handles Express `req/res`, status codes, and error serialization.
- `services`: core business logic, validation orchestration, PDA/signature operations.
- `repositories`: in-memory data access and filtering methods.
- `utils`: pure helpers for validation and PDA derivation.
- `types`: domain and API error contracts.

## Setup and Run

```bash
npm install
npm start
```

Server starts on `http://localhost:3000` (or `PORT` env variable if provided).

---

## API Documentation

Base URL: `http://localhost:3000/api/registry`

### 1) Register Top-Level Name

**Endpoint**: `POST /register`  
**Description**: Registers a top-level name and derives PDA using seeds `["name", name]`.

**cURL**
```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "myname",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

**Payload**
```json
{
  "name": "string",
  "programId": "base58-32-byte-pubkey",
  "owner": "base58-32-byte-pubkey"
}
```

**Success Response (201)**
```json
{
  "id": "1",
  "name": "myname",
  "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "pda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
  "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
  "bump": 254,
  "createdAt": "2026-04-09T10:00:00.000Z",
  "parentPda": null
}
```

**Error Response Example (409)**
```json
{
  "error": "Name already registered for this programId"
}
```

### 2) Resolve Top-Level Name

**Endpoint**: `GET /resolve/:programId/:name`  
**Description**: Resolves an existing top-level name to its full registration object.

**cURL**
```bash
curl http://localhost:3000/api/registry/resolve/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/myname
```

**Success Response (200)**
```json
{
  "id": "1",
  "name": "myname",
  "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "pda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
  "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
  "bump": 254,
  "createdAt": "2026-04-09T10:00:00.000Z",
  "parentPda": null
}
```

**Error Response (404)**
```json
{
  "error": "Name not found"
}
```

### 3) Register Sub-Name

**Endpoint**: `POST /sub/register`  
**Description**: Registers a sub-name under a parent top-level name using seeds `["sub", parentPda, subName]`.

**cURL**
```bash
curl -X POST http://localhost:3000/api/registry/sub/register \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "myname",
    "subName": "wallet",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

**Payload**
```json
{
  "parentName": "string",
  "subName": "string",
  "programId": "base58-32-byte-pubkey",
  "owner": "base58-32-byte-pubkey"
}
```

**Success Response (201)**
```json
{
  "id": "2",
  "name": "wallet",
  "parentName": "myname",
  "parentPda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
  "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "pda": "9T6wz4TKV4y9g7Vv8dF2NwY7aV6Nf2d4L3Qx2m8wZ4pR",
  "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
  "bump": 251,
  "createdAt": "2026-04-09T10:02:00.000Z"
}
```

**Error Response (404)**
```json
{
  "error": "Parent name not found"
}
```

### 4) Resolve Sub-Name

**Endpoint**: `GET /sub/resolve/:programId/:parentName/:subName`  
**Description**: Resolves sub-name within a parent namespace.

**cURL**
```bash
curl http://localhost:3000/api/registry/sub/resolve/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/myname/wallet
```

**Success Response (200)**
```json
{
  "id": "2",
  "name": "wallet",
  "parentName": "myname",
  "parentPda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
  "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "pda": "9T6wz4TKV4y9g7Vv8dF2NwY7aV6Nf2d4L3Qx2m8wZ4pR",
  "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
  "bump": 251,
  "createdAt": "2026-04-09T10:02:00.000Z"
}
```

### 5) Transfer Top-Level Ownership

**Endpoint**: `POST /transfer`  
**Description**: Transfers top-level name owner after ed25519 signature verification.

Message format must be:
`transfer:<name>:to:<newOwner>`

**cURL**
```bash
curl -X POST http://localhost:3000/api/registry/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "name": "myname",
    "newOwner": "8aWQxw9MXvN8x8j1LJf8kr5xJwF4r7TiFqvQ3Se5j2Yb",
    "signature": "BASE58_SIGNATURE_FROM_CURRENT_OWNER",
    "message": "transfer:myname:to:8aWQxw9MXvN8x8j1LJf8kr5xJwF4r7TiFqvQ3Se5j2Yb"
  }'
```

**Payload**
```json
{
  "programId": "string",
  "name": "string",
  "newOwner": "base58-32-byte-pubkey",
  "signature": "base58-signature",
  "message": "transfer:<name>:to:<newOwner>"
}
```

**Success Response (200)**
```json
{
  "id": "1",
  "name": "myname",
  "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "pda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
  "owner": "8aWQxw9MXvN8x8j1LJf8kr5xJwF4r7TiFqvQ3Se5j2Yb",
  "bump": 254,
  "createdAt": "2026-04-09T10:00:00.000Z",
  "parentPda": null
}
```

**Error Response (403)**
```json
{
  "error": "Invalid signature"
}
```

### 6) Verify PDA

**Endpoint**: `POST /verify`  
**Description**: Derives expected PDA from provided seed array and compares with `address`.

**cURL**
```bash
curl -X POST http://localhost:3000/api/registry/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "seeds": ["name", "myname"]
  }'
```

**Payload**
```json
{
  "address": "base58-32-byte-pubkey",
  "programId": "base58-32-byte-pubkey",
  "seeds": ["string", "string"]
}
```

**Success Response (200)**
```json
{
  "valid": true,
  "expectedPda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
  "bump": 254
}
```

### 7) List Top-Level Names

**Endpoint**: `GET /list/:programId`  
**Description**: Lists all top-level names for a program. Optional owner filter via query param.

**cURL (without filter)**
```bash
curl http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

**cURL (with owner filter)**
```bash
curl "http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA?owner=5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
```

**Success Response (200)**
```json
[
  {
    "id": "1",
    "name": "myname",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "pda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
    "bump": 254,
    "createdAt": "2026-04-09T10:00:00.000Z",
    "parentPda": null
  }
]
```

### 8) List Sub-Names Under Parent

**Endpoint**: `GET /list/:programId/:name/subs`  
**Description**: Lists all sub-name registrations under the given parent name.

**cURL**
```bash
curl http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/myname/subs
```

**Success Response (200)**
```json
[
  {
    "id": "2",
    "name": "wallet",
    "parentName": "myname",
    "parentPda": "7v6qW2v7f7xQ2fQv7tQjN1YV4n4xkD8M8G9YQfF6u9xN",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "pda": "9T6wz4TKV4y9g7Vv8dF2NwY7aV6Nf2d4L3Qx2m8wZ4pR",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
    "bump": 251,
    "createdAt": "2026-04-09T10:02:00.000Z"
  }
]
```

---

## Standard Error Contract

All endpoint errors return:

```json
{
  "error": "Descriptive message"
}
```

Common status codes:

- `200`: successful read/update operation
- `201`: successful create operation
- `400`: bad input / validation failure
- `403`: signature verification failed
- `404`: resource not found
- `409`: duplicate conflict

## End-to-End Project Flow

1. Client sends request to `/api/registry/*`.
2. Router delegates request to controller method.
3. Controller calls service and handles service errors uniformly.
4. Service:
   - validates input,
   - executes domain logic,
   - derives PDA/signature verification where required,
   - reads/writes via repository.
5. Repository performs in-memory data operations.
6. Controller returns typed JSON response with proper HTTP status code.

## Notes and Limitations

- Storage is in-memory (data resets on server restart).
- No authentication middleware beyond transfer signature verification.
- No pagination yet for list endpoints.
- Current name matching is case-sensitive.

## Useful Project Scripts

```bash
npm start
```
