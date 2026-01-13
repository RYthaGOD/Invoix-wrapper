# c-SPL Token Wrapper

![Uploading image.png…]()


A Solana Anchor project that wraps standard SPL tokens into Token-2022 Confidential Transfer compatible tokens ("c-SPL").

## Prerequisites

To run this project, you must have the Solana Tool Suite and Anchor installed:

1.  **Rust**: `rustup`
2.  **Solana**: `sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"` (or equivalent for Windows)
3.  **Anchor**: `avm install latest`
4.  **Node.js**: v18+

## Setup

1.  Install Node dependencies:
    ```bash
    npm install
    ```

2.  Update Program ID (if needed):
    *   The current ID in `lib.rs` and `Anchor.toml` is `F7e5FyeG8StgnEDWTgBZSYyacfQuzgtHCxu1qg9ucseR`.
    *   If you deploy/sync locally, you might need to run `anchor keys sync`.

## Build & Test

1.  **Build** the program:
    ```bash
    anchor build
    ```
    *This generates the `target/` directory and the IDL.*

2.  **Test**:
    ```bash
    anchor test
    ```
    *This starts a local test validator and runs the scenarios in `tests/c_spl_wrapper.ts`.*

## Architecture

*   **Initialize**: Creates a `Wrapped Mint` (Token-2022) derived from the `Original Mint` (SPL). The wrapped mint has the `ConfidentialTransfer` extension enabled (configurable).
*   **Wrap**: User sends SPL tokens to a program-controlled `Vault`. Program mints equal amount of c-SPL tokens to the user.
*   **Unwrap**: User burns c-SPL tokens. Program releases original SPL tokens from `Vault`.
