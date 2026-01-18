# Invoix Wrapper API Documentation

This API enables developers to integrate Invoix's token wrapping and confidential computation features into their own applications.

The API is **non-custodial**. It generates **serialized Solana transactions** that must be signed and submitted by the client (user's wallet). The API server never requests or stores user private keys.

## Base URL
Local: `http://localhost:3001/v1`
Production: `(Coming Soon)`

## Endpoints

### 1. Wrap Tokens
Convert standard SPL tokens into Invoix Confidential Wrapped Tokens.

- **URL**: `/wrap`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `payer` | string (Pubkey) | Yes | The public key of the user paying for the transaction. |
| `originalMint` | string (Pubkey) | Yes | The mint address of the token to be wrapped. |
| `amount` | number/string | Yes | The amount of tokens to wrap (in smallest units, e.g., lamports). |
| `userOriginalAccount` | string (Pubkey) | No | (Optional) The user's token account for the original mint. If omitted, it will be derived automatically. |
| `userWrappedAccount` | string (Pubkey) | No | (Optional) The user's token account for the wrapped mint. If omitted, it will be derived automatically. |

#### Example Request
```bash
curl -X POST http://localhost:3001/v1/wrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "UserPublicKeyHere...",
    "originalMint": "So11111111111111111111111111111111111111112",
    "amount": 1000000
  }'
```

#### Success Response
Returns a base64-encoded serialized transaction.
```json
{
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
  "message": "Transaction created successfully"
}
```

---

### 2. Unwrap Tokens
Convert Invoix Confidential Wrapped Tokens back into standard SPL tokens.

- **URL**: `/unwrap`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `payer` | string (Pubkey) | Yes | The public key of the user paying for the transaction. |
| `originalMint` | string (Pubkey) | Yes | The mint address of the original token (NOT the wrapped mint). |
| `amount` | number/string | Yes | The amount of tokens to unwrap. |
| `userOriginalAccount` | string (Pubkey) | No | (Optional) Derived if omitted. |
| `userWrappedAccount` | string (Pubkey) | No | (Optional) Derived if omitted. |

#### Example Request
```bash
curl -X POST http://localhost:3001/v1/unwrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "UserPublicKeyHere...",
    "originalMint": "So11111111111111111111111111111111111111112",
    "amount": 500000
  }'
```

#### Success Response
```json
{
  "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
  "message": "Transaction created successfully"
}
```

## Client-Side Integration Guide (TypeScript)

Here is how you can consume this API in a frontend application using `@solana/web3.js`.

```typescript
import { Connection, Transaction } from "@solana/web3.js";

const API_URL = "http://localhost:3001/v1";
const connection = new Connection("https://api.devnet.solana.com");

async function handleWrap(wallet, originalMint, amount) {
    // 1. Request Transaction from API
    const response = await fetch(`${API_URL}/wrap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            payer: wallet.publicKey.toString(),
            originalMint: originalMint.toString(),
            amount: amount
        })
    });
    
    const { transaction } = await response.json();
    
    // 2. Deserialize Transaction
    const txBuffer = Buffer.from(transaction, "base64");
    const tx = Transaction.from(txBuffer);
    
    // 3. Sign and Send (using Wallet Adapter)
    const signature = await wallet.sendTransaction(tx, connection);
    
    console.log("Tx Signature:", signature);
}
```

## Error Handling
The API returns standard HTTP status codes:
- `200 OK`: Success.
- `400 Bad Request`: Missing required fields or invalid data.
- `500 Internal Server Error`: Server-side processing error (e.g., RPC failure).
