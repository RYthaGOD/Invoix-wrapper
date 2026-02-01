# c-SPL Token Wrapper - Localnet Testing Guide

## Overview

This guide provides step-by-step instructions for testing the c-SPL Token Wrapper with **Token-2022 confidential transfers** on a local Solana validator.

> [!IMPORTANT]
> **Why Localnet?** As of January 2026, confidential transfers are temporarily disabled on devnet/mainnet due to ZK ElGamal Program security audits. Localnet testing with the `zk-ops` feature flag enabled is currently the only way to test confidential transfer functionality.

## Prerequisites

- **Node.js** v18+ installed
- **Solana CLI** installed (`solana --version`)
- **Anchor CLI** installed (`anchor --version`)
- **Rust** toolchain installed
- **Git** for cloning repositories
- At least **10GB** free disk space (for building SPL Token-2022)
- **15-20 minutes** for initial setup

## Quick Start

### 1. Build SPL Token-2022 with ZK-Ops

```bash
cd /home/craig/Invoix-wrapper

# Build Token-2022 with confidential transfer support
./scripts/setup-token2022.sh
```

**What this does:**
- Clones `solana-program-library` repository
- Builds `spl-token-2022` with `--features zk-ops`
- Copies compiled `.so` file to `target/deploy/`
- Cleans up temporary files

**Expected output:**
```
✅ Setup Complete!
Token-2022 Program Location:
  /home/craig/Invoix-wrapper/target/deploy/spl_token_2022.so
```

### 2. Start Localnet Validator

In a **new terminal**:

```bash
cd /home/craig/Invoix-wrapper

# Start validator with custom Token-2022 and wrapper programs
./scripts/start-localnet.sh
```

**What this does:**
- Kills any existing test validators
- Starts `solana-test-validator` with:
  - Custom Token-2022 program (with `zk-ops`)
  - c-SPL wrapper program
  - Increased compute limits for ZK proofs
- Waits for validator to be ready
- Tails validator logs

**Expected output:**
```
✅ Localnet Validator Running!

Validator Details:
  RPC URL: http://127.0.0.1:8899
  WebSocket: ws://127.0.0.1:8900

Loaded Programs:
  Token-2022: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
  Wrapper: D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY
```

> [!TIP]
> Keep this terminal open. The validator will run in the foreground and display logs.

### 3. Create Test Mint

In a **new terminal**:

```bash
cd /home/craig/Invoix-wrapper

# Create a test SPL token mint with 1000 tokens
npx ts-node scripts/create-test-mint.ts 6 1000
```

**Arguments:**
- `6` = decimals
- `1000` = initial supply

**Expected output:**
```
✅ Mint created: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
✅ Token account: 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T
✅ Minted 1000 tokens

💾 Save this mint for testing:
   export TEST_MINT=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

**Save the mint address:**
```bash
export TEST_MINT=<YOUR_MINT_ADDRESS>
```

### 4. Run End-to-End Test

```bash
# Run comprehensive test
npx ts-node scripts/test-localnet.ts
```

This script will:
1. Create a test mint
2. Show how to initialize the wrapper
3. Demonstrate wrap/unwrap flow
4. Provide instructions for CT verification

## Testing Workflows

### Workflow 1: Frontend Testing

1. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser**: http://localhost:5173

3. **Connect wallet**: Use your local keypair or a browser wallet

4. **Test wrapping**:
   - Enter your test mint address
   - Enter amount to wrap
   - Click "Wrap"
   - Approve transaction

5. **Verify wrapped tokens**:
   ```bash
   npx ts-node scripts/verify-ct-extension.ts <WRAPPED_MINT_ADDRESS>
   ```

6. **Test unwrapping**:
   - Switch to "Unwrap" tab
   - Enter amount
   - Click "Unwrap"
   - Approve transaction

### Workflow 2: API Testing

1. **Start the API** (in a new terminal):
   ```bash
   cd api
   cp .env.localnet .env
   npx ts-node src/index.ts
   ```

2. **Test health endpoint**:
   ```bash
   curl http://localhost:3001/v1/health
   ```

3. **Test wrap endpoint**:
   ```bash
   curl -X POST http://localhost:3001/v1/wrap \
     -H "Content-Type: application/json" \
     -d '{
       "payer": "YOUR_WALLET_ADDRESS",
       "originalMint": "YOUR_MINT_ADDRESS",
       "amount": "1000000"
     }' | jq
   ```

4. **Test unwrap endpoint**:
   ```bash
   curl -X POST http://localhost:3001/v1/unwrap \
     -H "Content-Type: application/json" \
     -d '{
       "payer": "YOUR_WALLET_ADDRESS",
       "originalMint": "YOUR_MINT_ADDRESS",
       "amount": "1000000"
     }' | jq
   ```

### Workflow 3: Verify Confidential Transfer Extension

After wrapping tokens, verify the CT extension is enabled:

```bash
# Get wrapped mint address from wrapper config
# Then verify:
npx ts-node scripts/verify-ct-extension.ts <WRAPPED_MINT_ADDRESS>
```

**Expected output:**
```
✅ Extended mint detected (Token-2022 with extensions)
   Extra data: XXX bytes

🔐 Confidential Transfer Extension:
   Status: ✅ LIKELY PRESENT (based on account size)
```

## Recording Demo Videos

### Terminal Recording

Use `asciinema` or `script` to record terminal sessions:

```bash
# Install asciinema
sudo apt install asciinema

# Record session
asciinema rec demo-terminal.cast

# Run your tests
./scripts/start-localnet.sh
npx ts-node scripts/create-test-mint.ts
npx ts-node scripts/test-localnet.ts

# Stop recording (Ctrl+D)
```

### Browser Recording

Use browser extensions like:
- **Loom** (Chrome/Firefox)
- **OBS Studio** (desktop recording)
- **SimpleScreenRecorder** (Linux)

**Recommended flow to record:**
1. Wallet connection
2. Entering mint address
3. Wrapping tokens (transaction approval)
4. Balance update
5. Unwrapping tokens
6. Final balance verification

### API Recording

Record API requests/responses:

```bash
# Use httpie with output redirection
http POST http://localhost:3001/v1/wrap \
  payer="..." \
  originalMint="..." \
  amount="1000000" \
  | tee api-wrap-response.json
```

## Troubleshooting

### Issue: "Token-2022 program not found"

**Cause:** `setup-token2022.sh` hasn't been run or failed

**Solution:**
```bash
./scripts/setup-token2022.sh
# Check for .so file
ls -lh target/deploy/spl_token_2022.so
```

### Issue: "Validator failed to start"

**Cause:** Port 8899 already in use or previous validator still running

**Solution:**
```bash
# Kill existing validators
pkill -f solana-test-validator

# Clean ledger
rm -rf test-ledger

# Try again
./scripts/start-localnet.sh
```

### Issue: "Transaction simulation failed"

**Possible causes:**
- Insufficient SOL for fees
- Token account not initialized
- Wrapper not initialized for this mint

**Solution:**
```bash
# Check SOL balance
solana balance --url http://127.0.0.1:8899

# Request airdrop
solana airdrop 2 --url http://127.0.0.1:8899

# Check token accounts
spl-token accounts --url http://127.0.0.1:8899
```

### Issue: "zk-ops feature not found"

**Cause:** SPL version mismatch

**Solution:**
```bash
# Check Cargo.toml in cloned repo
cd /tmp/spl-token2022-build/token/program-2022
grep "zk-ops" Cargo.toml

# If not found, try building without the flag
cargo build-sbf
```

### Issue: "Confidential transfer extension not detected"

**Cause:** Wrapper program may not be creating Token-2022 mints correctly

**Solution:**
1. Verify wrapper program is using `TOKEN_2022_PROGRAM_ID`
2. Check wrapper initialization includes CT extension
3. Review program logs in `validator.log`

## Common Commands

```bash
# Check validator status
solana cluster-version --url http://127.0.0.1:8899

# View validator logs
tail -f validator.log

# Stop validator
pkill -f solana-test-validator

# Check program deployment
solana program show D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY \
  --url http://127.0.0.1:8899

# List token accounts
spl-token accounts --url http://127.0.0.1:8899

# Check mint info
spl-token display <MINT_ADDRESS> --url http://127.0.0.1:8899
```

## Next Steps

After successful localnet testing:

1. **Security Audit**: Review against solana-dev security checklist
2. **Performance Testing**: Test with larger amounts and edge cases
3. **Documentation**: Create user-facing guides
4. **Devnet Migration**: Wait for Confidential Balances on devnet
5. **Mainnet Preparation**: Final audits and deployment planning

## Additional Resources

- [Token-2022 Documentation](https://spl.solana.com/token-2022)
- [Confidential Transfers Guide](https://spl.solana.com/confidential-token)
- [Solana Test Validator Docs](https://docs.solana.com/developing/test-validator)

## Support

For issues:
- Check `validator.log` for validator errors
- Check browser console for frontend errors
- Review API logs for backend errors
- Verify all PDAs are correctly derived
- Ensure Token-2022 program is loaded with `zk-ops`
