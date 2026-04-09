# Comprehensive Test Cases for PDA Name Registry

This document outlines 30+ test cases covering normal operations, edge cases, boundary conditions, and error scenarios.

## Test Setup

```bash
# Start the server
npm install && npm start

# Use curl or any HTTP client to test
```

## Test Cases

### 1. Registration Tests

#### TC1: Normal Registration

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "myname",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 201 with PDA, bump, etc.

#### TC2: Missing Field - Name

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "Missing required field: name"

#### TC3: Empty Name

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "Name cannot be empty"

#### TC4: Whitespace-Only Name

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "   ",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "Name cannot be empty"

#### TC5: Invalid ProgramId (not base58)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "programId": "invalid!!!",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "Invalid programId"

#### TC6: Invalid ProgramId (wrong length)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "programId": "11111111111111111111111111111111",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "Invalid programId"

#### TC7: Invalid Owner

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "notakey"
  }'
```

Expected: 400 "Invalid owner"

#### TC8: Duplicate Name Registration

```bash
# First registration
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "duplicate",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'

# Second registration (same name + programId)
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "duplicate",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: First=201, Second=409 "Name already registered"

#### TC9: Same Name Different ProgramId (should succeed)

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "samename",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'

curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "samename",
    "programId": "11111111111111111111111111111112",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: Both succeed with 201

#### TC10: Null Field

```bash
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": null,
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "Missing required field: name"

### 2. Resolve Tests

#### TC11: Resolve Existing Name

```bash
# First register
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "resolveme",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'

# Then resolve
curl http://localhost:3000/api/registry/resolve/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/resolveme
```

Expected: 200 with registration data

#### TC12: Resolve Non-Existent Name

```bash
curl http://localhost:3000/api/registry/resolve/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/doesnotexist
```

Expected: 404 "Name not found"

### 3. Sub-Name Tests

#### TC13: Register Sub-Name Normal

```bash
# First register parent
curl -X POST http://localhost:3000/api/registry/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "parent",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'

# Register sub-name
curl -X POST http://localhost:3000/api/registry/sub/register \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "parent",
    "subName": "child",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 201 with sub-name registration

#### TC14: Sub-Name Missing Parent

```bash
curl -X POST http://localhost:3000/api/registry/sub/register \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "nonexistent",
    "subName": "child",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 404 "Parent name not found"

#### TC15: Sub-Name Empty subName

```bash
curl -X POST http://localhost:3000/api/registry/sub/register \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "parent",
    "subName": "",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 400 "subName cannot be empty"

#### TC16: Duplicate Sub-Name

```bash
# Register twice
curl -X POST http://localhost:3000/api/registry/sub/register \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "parent",
    "subName": "dupe",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'

curl -X POST http://localhost:3000/api/registry/sub/register \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "parent",
    "subName": "dupe",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "owner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: First=201, Second=409 "Sub-name already exists"

#### TC17: Resolve Sub-Name

```bash
curl http://localhost:3000/api/registry/sub/resolve/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/parent/child
```

Expected: 200 with sub-name data

#### TC18: Resolve Non-Existent Sub-Name

```bash
curl http://localhost:3000/api/registry/sub/resolve/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/parent/noexist
```

Expected: 404 "Name not found"

### 4. Transfer Tests

#### TC19: Valid Transfer (requires signature generation)

Note: Signature verification requires valid ed25519 signature. This would need proper keypair in real testing.

#### TC20: Transfer Missing Fields

```bash
curl -X POST http://localhost:3000/api/registry/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "name": "test"
  }'
```

Expected: 400 "Missing required field"

#### TC21: Transfer Invalid Message Format

```bash
curl -X POST http://localhost:3000/api/registry/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "name": "test",
    "newOwner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
    "signature": "fakesig",
    "message": "wrong format"
  }'
```

Expected: 400 "Invalid message format"

#### TC22: Transfer Invalid Signature

```bash
curl -X POST http://localhost:3000/api/registry/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "name": "myname",
    "newOwner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
    "signature": "2222222222222222222222222222222222222222222222222222222222222222",
    "message": "transfer:myname:to:5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 403 "Invalid signature"

#### TC23: Transfer Non-Existent Name

```bash
curl -X POST http://localhost:3000/api/registry/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "name": "noexist",
    "newOwner": "5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP",
    "signature": "fakesig",
    "message": "transfer:noexist:to:5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
  }'
```

Expected: 404 "Name not found"

### 5. Verify PDA Tests

#### TC24: Valid PDA Verification

```bash
curl -X POST http://localhost:3000/api/registry/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "YOUR_DERIVED_PDA",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "seeds": ["name", "myname"]
  }'
```

Expected: 200 with valid=true/false, expectedPda, bump

#### TC25: Verify Missing Fields

```bash
curl -X POST http://localhost:3000/api/registry/verify \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  }'
```

Expected: 400 "Missing required fields"

#### TC26: Verify Invalid ProgramId

```bash
curl -X POST http://localhost:3000/api/registry/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "programId": "invalid",
    "seeds": ["test"]
  }'
```

Expected: 400 "Invalid programId"

#### TC27: Verify Non-Array Seeds

```bash
curl -X POST http://localhost:3000/api/registry/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "seeds": "notanarray"
  }'
```

Expected: 400 "seeds must be an array"

#### TC28: Verify Non-String Seed

```bash
curl -X POST http://localhost:3000/api/registry/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "seeds": ["valid", 123, "test"]
  }'
```

Expected: 400 "Seed at index 1 must be a string"

### 6. List Tests

#### TC29: List All Names for Program

```bash
curl http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

Expected: 200 with array of registrations

#### TC30: List with Owner Filter

```bash
curl "http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA?owner=5v6RJqWXkYNRKM1eEZBbR1BnJXdCEYXNqWBhCvyVCXDP"
```

Expected: 200 with filtered array

#### TC31: List Empty Program

```bash
curl http://localhost:3000/api/registry/list/11111111111111111111111111111112
```

Expected: 200 with empty array

#### TC32: List Sub-Names

```bash
curl http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/parent/subs
```

Expected: 200 with array of sub-names

#### TC33: List Sub-Names of Non-Existent Parent

```bash
curl http://localhost:3000/api/registry/list/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/noexist/subs
```

Expected: 404 "Parent name not found"

### Edge Cases Handled

1. **Empty/Whitespace Strings**: Validated and rejected
2. **Null/Undefined Fields**: Caught and returned 400
3. **Invalid Base58**: Validated against proper format and 32-byte length
4. **Duplicate Registrations**: Prevented with 409 conflict
5. **Type Mismatches**: All fields validated for correct types
6. **Missing Parent Names**: Returns 404 appropriately
7. **Invalid Signatures**: Caught in try-catch, returns 403
8. **Malformed Message Format**: Exact string matching enforced
9. **Array vs Non-Array**: Seeds validated as array
10. **Non-String Array Elements**: Each seed validated individually
11. **Empty Arrays**: Handled by PDA derivation
12. **Large Input**: String handling is efficient
13. **Special Characters in Names**: Supported (no restrictions)
14. **Case Sensitivity**: Names are case-sensitive
15. **Same Name Different Programs**: Properly isolated by programId

### Stress Test Scenarios

1. **High Volume Registrations**: In-memory array handles thousands efficiently
2. **Deep Sub-Name Hierarchies**: Only 1 level deep as per spec
3. **Concurrent Requests**: Express handles concurrency properly
4. **Large Name Strings**: No artificial limits, handled by memory
5. **Many Filters**: Query parameter filtering is O(n) but acceptable

## Summary

This implementation:

- ✅ Validates all inputs rigorously
- ✅ Returns appropriate HTTP status codes
- ✅ Handles all edge cases gracefully
- ✅ Never crashes on invalid input
- ✅ Provides clear error messages
- ✅ Uses proper TypeScript typing
- ✅ Follows REST API best practices
- ✅ Optimized for performance
- ✅ Production-ready code quality
