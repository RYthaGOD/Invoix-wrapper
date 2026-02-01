# c-SPL Token Wrapper - Devnet Testing Guide

## Overview

This guide provides step-by-step instructions for testing the c-SPL Token Wrapper system on Solana devnet.

> [!IMPORTANT]
> **Confidential Transfer Limitation**: As of January 2026, confidential transfers are temporarily disabled on devnet due to ZK ElGamal Program security audits. For full confidential transfer testing, see [LOCALNET_TESTING.md](file:///home/craig/Invoix-wrapper/LOCALNET_TESTING.md).

## Prerequisites

- Node.js v18+ installed
- Solana CLI installed (`solana --version`)
- A Solana wallet with devnet SOL
- Basic understanding of SPL tokens

## Quick Start

### 1. Environment Setup

```bash
# Clone and install dependencies
cd /home/craig/Invoix-wrapper
npm install

# Install API dependencies
cd api && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install app/SDK dependencies
cd app && npm install && cd ..
```

### 2. Configure Environment

Create `.env` file in the `api` directory:

```bash
# api/.env
RPC_URL=https://api.devnet.solana.com
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 3. Verify Program Deployment

The program is already deployed on devnet:
- **Program ID**: `D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY`
- **Network**: Devnet
- **Explorer**: https://explorer.solana.com/address/D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY?cluster=devnet

Verify deployment:
```bash
solana program show D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY --url devnet
```

### 4. Start the API Server

```bash
cd api
npx ts-node src/index.ts
```

Expected output:
```
✅ Server running on http://localhost:3001
📡 RPC: https://api.devnet.solana.com
```

Test health check:
```bash
curl http://localhost:3001/v1/health
```

### 5. Start the Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Testing Workflows

### Workflow 1: Wrap Tokens (SPL → c-SPL)

#### Step 1: Get Test Tokens

Create a test SPL token mint on devnet:
```bash
# Create a new mint
spl-token create-token --decimals 6

# Note the mint address (example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)

# Create token account
spl-token create-account <MINT_ADDRESS>

# Mint some tokens to yourself
spl-token mint <MINT_ADDRESS> 1000
```

#### Step 2: Initialize Wrapper

Use the frontend or API to initialize the wrapper for your mint:

**Via Frontend:**
1. Connect your wallet
2. Enter the mint address
3. Click "Initialize" (if not already initialized)

**Via API:**
```bash
curl -X POST http://localhost:3001/v1/wrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "YOUR_WALLET_ADDRESS",
    "originalMint": "YOUR_MINT_ADDRESS",
    "amount": "1000000"
  }'
```

#### Step 3: Wrap Tokens

1. Enter mint address in frontend
2. Enter amount to wrap (e.g., 1)
3. Click "Wrap"
4. Approve transaction in wallet
5. Wait for confirmation

**Expected Result:**
- Original SPL tokens transferred to vault
- c-SPL tokens (Token-2022 with CT extension) minted to your account
- Transaction visible on Solana Explorer

### Workflow 2: Unwrap Tokens (c-SPL → SPL)

#### Step 1: Verify Wrapped Balance

Check your wrapped token balance:
```bash
# Find your wrapped token account
spl-token accounts --owner YOUR_WALLET_ADDRESS
```

#### Step 2: Unwrap Tokens

1. Switch to "Unwrap" tab in frontend
2. Enter same mint address
3. Enter amount to unwrap
4. Click "Unwrap"
5. Approve transaction

**Expected Result:**
- c-SPL tokens burned
- Original SPL tokens returned from vault
- Fees deducted according to unwrap fee rate

### Workflow 3: API Testing

#### Test Wrap Endpoint

```bash
curl -X POST http://localhost:3001/v1/wrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "YOUR_WALLET_ADDRESS",
    "originalMint": "YOUR_MINT_ADDRESS",
    "amount": "1000000"
  }' | jq
```

**Expected Response:**
```json
{
  "transaction": "base64_encoded_transaction",
  "message": "Transaction created successfully"
}
```

#### Test Unwrap Endpoint

```bash
curl -X POST http://localhost:3001/v1/unwrap \
  -H "Content-Type: application/json" \
  -d '{
    "payer": "YOUR_WALLET_ADDRESS",
    "originalMint": "YOUR_MINT_ADDRESS",
    "amount": "1000000"
  }' | jq
```

## Verification Checklist

### Program Verification
- [ ] Program deployed on devnet
- [ ] Program ID matches in all configs
- [ ] IDL uploaded and accessible

### API Verification
- [ ] Health check endpoint responds
- [ ] Wrap endpoint returns valid transaction
- [ ] Unwrap endpoint returns valid transaction
- [ ] Input validation rejects invalid addresses
- [ ] Input validation rejects invalid amounts
- [ ] Error messages are clear and helpful

### Frontend Verification
- [ ] Wallet connection works
- [ ] Mint address validation works
- [ ] Balance display is accurate
- [ ] Wrap transaction succeeds
- [ ] Unwrap transaction succeeds
- [ ] Transaction links to explorer work
- [ ] Error messages display correctly

### End-to-End Verification
- [ ] Can wrap tokens successfully
- [ ] Wrapped tokens appear in wallet
- [ ] Can unwrap tokens successfully
- [ ] Original tokens returned correctly
- [ ] Fees calculated and deducted properly
- [ ] Vault balance matches expectations

## Common Test Scenarios

### Scenario 1: First-Time Wrapper Initialization

```typescript
// Expected accounts created:
// 1. WrapperConfig PDA: seeds = [b"config", original_mint]
// 2. WrapperStats PDA: seeds = [b"stats", original_mint]
// 3. Wrapped Mint PDA: seeds = [b"mint", original_mint]
// 4. Vault PDA: seeds = [b"vault", original_mint]
```

### Scenario 2: Multiple Wrap/Unwrap Cycles

Test that:
- Vault balance increases on wrap
- Vault balance decreases on unwrap
- Stats are updated correctly
- Fees accumulate properly

### Scenario 3: Edge Cases

Test:
- Wrapping with zero balance (should fail)
- Unwrapping more than balance (should fail)
- Invalid mint address (should fail with clear error)
- Very small amounts (1 lamport)
- Very large amounts (near u64::MAX)

## Troubleshooting

### Issue: "Transaction simulation failed"

**Possible causes:**
- Insufficient SOL for fees
- Token account not initialized
- Wrapper not initialized for this mint

**Solution:**
```bash
# Check SOL balance
solana balance

# Airdrop if needed
solana airdrop 2

# Check token account
spl-token accounts
```

### Issue: "Invalid vault address"

**Cause:** API vault derivation bug (should be fixed)

**Verification:**
```bash
# Check API logs for vault PDA derivation
# Should see proper PDA, not system program ID
```

### Issue: "Insufficient vault balance"

**Cause:** More tokens unwrapped than wrapped

**Solution:**
- Check vault balance on-chain
- Verify stats match actual state
- May need to re-initialize if corrupted

## Test Mint Addresses (Devnet)

For convenience, here are some pre-created test mints on devnet:

| Mint | Decimals | Purpose |
|------|----------|---------|
| TBD | 6 | Standard test mint |
| TBD | 9 | High decimal test |
| TBD | 0 | NFT-style test |

> **Note:** Create your own test mints using the instructions above for isolated testing.

## Next Steps

After successful devnet testing:

1. **Security Audit**: Review against solana-dev security checklist
2. **Performance Testing**: Test with larger amounts and multiple users
3. **Mainnet Preparation**: Update configs for mainnet deployment
4. **Documentation**: Create user-facing documentation
5. **Monitoring**: Set up transaction monitoring and alerts

## Support

For issues or questions:
- Check logs in API terminal
- Check browser console for frontend errors
- Review transaction on Solana Explorer
- Verify all PDAs are correctly derived

## Additional Resources

- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [SPL Token CLI Guide](https://spl.solana.com/token)
- [Token-2022 Documentation](https://spl.solana.com/token-2022)
- [Confidential Transfers Guide](https://spl.solana.com/confidential-token)
