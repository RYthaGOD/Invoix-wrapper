# Demo Scenarios for c-SPL Token Wrapper

This document outlines specific scenarios to demonstrate and record for the c-SPL Token Wrapper system.

## Scenario 1: Basic Wrap/Unwrap Flow

**Duration**: ~3 minutes  
**Purpose**: Demonstrate core functionality

### Steps:

1. **Setup**:
   - Start localnet validator
   - Create test mint with 1000 tokens
   - Show initial balances

2. **Wrap Tokens**:
   - Open frontend
   - Connect wallet
   - Enter mint address
   - Wrap 100 tokens
   - Show transaction confirmation
   - Display new wrapped token balance

3. **Unwrap Tokens**:
   - Switch to unwrap tab
   - Unwrap 50 tokens
   - Show fee deduction
   - Display final balances

4. **Verification**:
   - Show vault balance
   - Show wrapper stats
   - Verify token accounts

### Recording Tips:
- Zoom in on important UI elements
- Pause after each transaction to show confirmation
- Display terminal output alongside browser

---

## Scenario 2: Confidential Transfer Extension Verification

**Duration**: ~2 minutes  
**Purpose**: Prove CT extension is enabled

### Steps:

1. **Wrap Tokens**:
   - Wrap tokens using frontend or API
   - Get wrapped mint address

2. **Verify Extension**:
   ```bash
   npx ts-node scripts/verify-ct-extension.ts <WRAPPED_MINT>
   ```

3. **Show Output**:
   - Extended mint detected
   - Extra data bytes
   - CT extension status

4. **Compare**:
   - Show standard SPL mint (82 bytes)
   - Show Token-2022 mint with CT (larger size)

### Recording Tips:
- Split screen: terminal + browser
- Highlight the "Extended mint detected" message
- Show account size comparison

---

## Scenario 3: API Integration

**Duration**: ~2 minutes  
**Purpose**: Demonstrate programmatic access

### Steps:

1. **Start API Server**:
   ```bash
   cd api
   cp .env.localnet .env
   npx ts-node src/index.ts
   ```

2. **Test Health Endpoint**:
   ```bash
   curl http://localhost:3001/v1/health | jq
   ```

3. **Wrap via API**:
   ```bash
   curl -X POST http://localhost:3001/v1/wrap \
     -H "Content-Type: application/json" \
     -d '{
       "payer": "...",
       "originalMint": "...",
       "amount": "1000000"
     }' | jq
   ```

4. **Show Response**:
   - Transaction base64
   - Success message

5. **Unwrap via API**:
   ```bash
   curl -X POST http://localhost:3001/v1/unwrap \
     -H "Content-Type: application/json" \
     -d '{
       "payer": "...",
       "originalMint": "...",
       "amount": "500000"
     }' | jq
   ```

### Recording Tips:
- Use `jq` for pretty-printed JSON
- Show both request and response
- Demonstrate error handling with invalid input

---

## Scenario 4: Admin Controls

**Duration**: ~2 minutes  
**Purpose**: Show governance features

### Steps:

1. **Pause Wrapper**:
   - Call pause instruction
   - Attempt to wrap (should fail)
   - Show error message

2. **Unpause Wrapper**:
   - Call unpause instruction
   - Wrap successfully

3. **Update Fees**:
   - Show current fees
   - Update wrap/unwrap fees
   - Demonstrate new fee calculation

4. **Withdraw Fees**:
   - Show accumulated fees
   - Withdraw to authority
   - Verify balance update

### Recording Tips:
- Show before/after states
- Highlight security checks
- Demonstrate fee cap (10% max)

---

## Scenario 5: Error Handling

**Duration**: ~2 minutes  
**Purpose**: Show robustness

### Steps:

1. **Insufficient Balance**:
   - Try to wrap more tokens than available
   - Show clear error message

2. **Invalid Mint Address**:
   - Enter malformed address
   - Show validation error

3. **Uninitialized Wrapper**:
   - Try to wrap for non-initialized mint
   - Show initialization required message

4. **Insufficient SOL**:
   - Wallet with low SOL balance
   - Show transaction fee error

### Recording Tips:
- Show error messages clearly
- Demonstrate input validation
- Highlight user-friendly error text

---

## Scenario 6: Multi-Token Testing

**Duration**: ~3 minutes  
**Purpose**: Show scalability

### Steps:

1. **Create Multiple Mints**:
   ```bash
   npx ts-node scripts/create-test-mint.ts 6 1000  # USDC-like
   npx ts-node scripts/create-test-mint.ts 9 1000  # SOL-like
   npx ts-node scripts/create-test-mint.ts 0 100   # NFT-like
   ```

2. **Initialize Wrappers**:
   - Initialize wrapper for each mint
   - Show different configurations

3. **Wrap Each Type**:
   - Wrap 6-decimal token
   - Wrap 9-decimal token
   - Wrap 0-decimal token

4. **Show Stats**:
   - Display stats for each wrapper
   - Compare vault balances
   - Show total wrapped amounts

### Recording Tips:
- Use split screen for multiple terminals
- Show parallel operations
- Highlight decimal handling

---

## Recording Checklist

### Before Recording:
- [ ] Clean terminal history
- [ ] Set terminal font size to 14+
- [ ] Close unnecessary applications
- [ ] Test audio (if narrating)
- [ ] Prepare script/talking points
- [ ] Have all commands ready in a file

### During Recording:
- [ ] Speak clearly and slowly
- [ ] Pause after important actions
- [ ] Zoom in on key UI elements
- [ ] Show full transaction confirmations
- [ ] Highlight important output

### After Recording:
- [ ] Review for clarity
- [ ] Add captions/annotations
- [ ] Trim unnecessary parts
- [ ] Export in high quality (1080p+)
- [ ] Upload to appropriate platform

---

## Recommended Tools

### Screen Recording:
- **OBS Studio** (free, cross-platform)
- **SimpleScreenRecorder** (Linux)
- **Loom** (browser-based)

### Terminal Recording:
- **asciinema** (terminal-only)
- **terminalizer** (animated GIFs)

### Video Editing:
- **DaVinci Resolve** (free)
- **Kdenlive** (Linux)
- **OpenShot** (simple, cross-platform)

### Annotations:
- **Screencast-O-Matic**
- **Camtasia**
- **Snagit**

---

## Output Formats

### For Documentation:
- **GIF**: Short loops (< 30 seconds)
- **WebM**: Longer demos (1-3 minutes)
- **MP4**: Full tutorials (3-10 minutes)

### For Social Media:
- **Twitter**: 2:20 max, square format
- **YouTube**: 1080p, 16:9
- **LinkedIn**: 10 minutes max

### For GitHub:
- **Embedded GIFs**: < 10MB
- **YouTube links**: For longer content
- **asciinema**: For terminal-only demos
