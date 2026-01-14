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

```bash
# Install dependencies
npm install

# Build program
anchor build

# Run tests (requires Solana tools)
anchor test
```

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
