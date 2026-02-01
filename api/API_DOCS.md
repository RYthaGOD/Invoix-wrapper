# API Documentation

## Base URL

```
http://localhost:3001/v1
```

## Endpoints

### Health Check

**GET** `/v1/health`

Check API server status.

**Response:**
```json
{
  "status": "ok",
  "service": "c-SPL Wrapper API",
  "version": "1.0.0"
}
```

---

### Wrap Tokens

**POST** `/v1/wrap`

Create a transaction to wrap SPL tokens into c-SPL (Token-2022 with Confidential Transfer extension).

**Request Body:**
```json
{
  "payer": "string",              // Required: Wallet address (base58)
  "originalMint": "string",       // Required: SPL token mint address
  "amount": "string",             // Required: Amount in lamports (as string)
  "userOriginalAccount": "string" // Optional: User's SPL token account
}
```

**Response:**
```json
{
  "transaction": "string",  // Base64-encoded serialized transaction
  "message": "Transaction created successfully"
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Missing required fields",
  "required": ["payer", "originalMint", "amount"]
}
```

```json
{
  "error": "Invalid payer address format"
}
```

```json
{
  "error": "Invalid amount: must be a positive integer"
}
```

500 Internal Server Error:
```json
{
  "error": "Error message"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/v1/wrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "originalMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "1000000"
  }'
```

---

### Unwrap Tokens

**POST** `/v1/unwrap`

Create a transaction to unwrap c-SPL tokens back to original SPL tokens.

**Request Body:**
```json
{
  "payer": "string",              // Required: Wallet address (base58)
  "originalMint": "string",       // Required: Original SPL token mint address
  "amount": "string",             // Required: Amount in lamports (as string)
  "userOriginalAccount": "string" // Optional: User's SPL token account
}
```

**Response:**
```json
{
  "transaction": "string",  // Base64-encoded serialized transaction
  "message": "Transaction created successfully"
}
```

**Error Responses:** Same as wrap endpoint

**Example:**
```bash
curl -X POST http://localhost:3001/v1/unwrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "originalMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "1000000"
  }'
```

---

## Transaction Flow

1. **Client calls API endpoint** with required parameters
2. **API derives PDAs**:
   - Vault PDA: `[b"vault", original_mint]`
   - Wrapped Mint PDA: `[b"mint", original_mint]`
   - User's token accounts (if not provided)
3. **API builds transaction** using Codama-generated instruction builders
4. **API returns serialized transaction** as base64 string
5. **Client deserializes and signs** transaction
6. **Client submits** to Solana network

## Integration Example

### JavaScript/TypeScript

```typescript
import { VersionedTransaction, Connection } from '@solana/web3.js';

async function wrapTokens(
  payer: string,
  originalMint: string,
  amount: string
) {
  // Call API
  const response = await fetch('http://localhost:3001/v1/wrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payer, originalMint, amount })
  });

  const { transaction } = await response.json();

  // Deserialize
  const txBytes = Uint8Array.from(atob(transaction), c => c.charCodeAt(0));
  const tx = VersionedTransaction.deserialize(txBytes);

  // Sign and send
  const connection = new Connection('https://api.devnet.solana.com');
  const signature = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(signature);

  return signature;
}
```

### Python

```python
import requests
import base64
from solders.transaction import VersionedTransaction

def wrap_tokens(payer: str, original_mint: str, amount: str):
    # Call API
    response = requests.post(
        'http://localhost:3001/v1/wrap',
        json={
            'payer': payer,
            'originalMint': original_mint,
            'amount': amount
        }
    )
    
    data = response.json()
    
    # Deserialize
    tx_bytes = base64.b64decode(data['transaction'])
    tx = VersionedTransaction.from_bytes(tx_bytes)
    
    # Sign and send (using your wallet library)
    # ...
    
    return tx
```

## Environment Variables

Configure the API server with these environment variables:

```bash
# Required
RPC_URL=https://api.devnet.solana.com  # Solana RPC endpoint

# Optional
PORT=3001                               # API server port (default: 3001)
CORS_ORIGIN=*                          # CORS allowed origins (default: *)
```

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider adding:
- Rate limiting per IP
- Request throttling
- API key authentication

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Server error

All errors return JSON with an `error` field describing the issue.

## Security Considerations

1. **Input Validation**: All addresses and amounts are validated before processing
2. **No Private Keys**: API never handles private keys - only builds unsigned transactions
3. **CORS**: Configure `CORS_ORIGIN` appropriately for production
4. **HTTPS**: Use HTTPS in production environments
5. **Rate Limiting**: Implement rate limiting for production

## Support

For issues or questions:
- Check API logs for detailed error messages
- Verify input parameters match expected formats
- Ensure RPC endpoint is accessible
- Test with `/v1/health` endpoint first
