# c-SPL Token Wrapper

A Solana Anchor program that wraps standard SPL tokens into Token-2022 Confidential Transfer compatible tokens.

## Features

- ✅ Wrap SPL tokens → Confidential SPL tokens
- ✅ Unwrap back to original SPL tokens
- ✅ Configurable fees (max 10%)
- ✅ Admin controls (pause, fees, authority transfer)
- ✅ Emergency freeze/thaw capability
- ✅ Fee withdrawal for protocol revenue

## Quick Start

### 1. Build Program & SDK
```bash
# Install root dependencies
npm install

# Build program
anchor build

# Run tests
anchor test
```

### 2. Run Frontend local
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 3. Verify E2E on Devnet
```bash
cd app
# Ensure detailed logs and devnet wallet
npx ts-node src/verify_e2e.ts
```

### 4. Test on Localnet (with Confidential Transfers)
```bash
# Build Token-2022 with zk-ops
./scripts/setup-token2022.sh

# Start localnet validator
./scripts/start-localnet.sh

# Run tests
npx ts-node scripts/test-localnet.ts

# See LOCALNET_TESTING.md for full guide
```

## Deployed Addresses (Devnet)
- **Program ID**: `D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY`


## Architecture

```
┌─────────────┐     wrap      ┌─────────────────┐
│  SPL Token  │ ────────────→ │ c-SPL Token     │
│  (Original) │               │ (CT-enabled)    │
└─────────────┘               └─────────────────┘
       ↓                              ↓
  ┌─────────┐                 ┌──────────────┐
  │  Vault  │←── backs ──────→│ Wrapped Mint │
  └─────────┘                 └──────────────┘
       ↑
  WrapperConfig (PDA) controls all
```

## Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize` | Creates wrapped mint with CT extension |
| `wrap` | Deposit SPL, receive c-SPL |
| `unwrap` | Burn c-SPL, receive SPL |
| `pause/unpause` | Emergency circuit breaker |
| `set_fees` | Update wrap/unwrap fees (max 10%) |
| `set_authority` | Transfer admin ownership |
| `withdraw_fees` | Collect accumulated fees |
| `freeze_account` | Freeze suspicious accounts |
| `thaw_account` | Unfreeze accounts |

## Client SDK

```typescript
import { 
  createWrapInstruction,
  createUnwrapInstruction,
  findWrapperConfigPda 
} from "c-spl-wrapper-sdk";

// Wrap tokens
const wrapIx = await createWrapInstruction(
  program, user.publicKey, originalMint,
  userOriginalAccount, userWrappedAccount,
  new BN(1000)
);
```

## Security

- PDAs control all authority operations
- Fees capped at 10% maximum
- Zero-address authority prevention
- Vault balance sanity checks
- Emergency freeze capability

## License

MIT
