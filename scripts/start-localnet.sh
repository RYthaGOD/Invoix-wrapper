#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Localnet Validator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOKEN_2022_SO="$PROJECT_ROOT/target/deploy/spl_token_2022.so"
WRAPPER_SO="$PROJECT_ROOT/target/deploy/c_spl_wrapper.so"
LEDGER_DIR="$PROJECT_ROOT/test-ledger"

# Token-2022 Program ID (official)
TOKEN_2022_PROGRAM_ID="TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

# Wrapper Program ID (from Anchor.toml)
WRAPPER_PROGRAM_ID="D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY"

echo -e "${YELLOW}📦 Configuration:${NC}"
echo -e "  Project Root: $PROJECT_ROOT"
echo -e "  Ledger Directory: $LEDGER_DIR"
echo -e "  Token-2022 Program: $TOKEN_2022_PROGRAM_ID"
echo -e "  Wrapper Program: $WRAPPER_PROGRAM_ID"
echo ""

# Check if Token-2022 .so exists
if [ ! -f "$TOKEN_2022_SO" ]; then
    echo -e "${RED}❌ Error: Token-2022 program not found at $TOKEN_2022_SO${NC}"
    echo -e "${YELLOW}Please run ./scripts/setup-token2022.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found Token-2022 program: $TOKEN_2022_SO${NC}"

# Check if wrapper .so exists
if [ ! -f "$WRAPPER_SO" ]; then
    echo -e "${YELLOW}⚠️  Wrapper program not found at $WRAPPER_SO${NC}"
    echo -e "${YELLOW}Building wrapper program...${NC}"
    cd "$PROJECT_ROOT"
    anchor build
    if [ ! -f "$WRAPPER_SO" ]; then
        echo -e "${RED}❌ Error: Failed to build wrapper program${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Found wrapper program: $WRAPPER_SO${NC}"
echo ""

# Kill any existing test validator
echo -e "${BLUE}🛑 Stopping any existing test validator...${NC}"
pkill -f solana-test-validator || true
sleep 2

# Clean ledger directory if it exists
if [ -d "$LEDGER_DIR" ]; then
    echo -e "${YELLOW}🧹 Cleaning ledger directory...${NC}"
    rm -rf "$LEDGER_DIR"
fi

# Start the validator
echo -e "${BLUE}🚀 Starting solana-test-validator...${NC}"
echo ""

solana-test-validator \
    --ledger "$LEDGER_DIR" \
    --bpf-program "$TOKEN_2022_PROGRAM_ID" "$TOKEN_2022_SO" \
    --bpf-program "$WRAPPER_PROGRAM_ID" "$WRAPPER_SO" \
    --reset \
    --quiet \
    --compute-unit-limit 1400000 \
    > "$PROJECT_ROOT/validator.log" 2>&1 &

VALIDATOR_PID=$!

echo -e "${YELLOW}⏳ Waiting for validator to start...${NC}"

# Wait for validator to be ready
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if solana cluster-version --url http://127.0.0.1:8899 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Validator is ready!${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "${YELLOW}   Attempt $RETRY_COUNT/$MAX_RETRIES...${NC}"
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Error: Validator failed to start${NC}"
    echo -e "${YELLOW}Check validator.log for details:${NC}"
    tail -n 20 "$PROJECT_ROOT/validator.log"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Localnet Validator Running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Validator Details:${NC}"
echo -e "  PID: $VALIDATOR_PID"
echo -e "  RPC URL: ${BLUE}http://127.0.0.1:8899${NC}"
echo -e "  WebSocket: ${BLUE}ws://127.0.0.1:8900${NC}"
echo -e "  Ledger: $LEDGER_DIR"
echo -e "  Logs: $PROJECT_ROOT/validator.log"
echo ""
echo -e "${YELLOW}Loaded Programs:${NC}"
echo -e "  Token-2022: $TOKEN_2022_PROGRAM_ID"
echo -e "  Wrapper: $WRAPPER_PROGRAM_ID"
echo ""
echo -e "${YELLOW}Quick Commands:${NC}"
echo -e "  Check status: ${BLUE}solana cluster-version --url http://127.0.0.1:8899${NC}"
echo -e "  View logs: ${BLUE}tail -f validator.log${NC}"
echo -e "  Stop validator: ${BLUE}pkill -f solana-test-validator${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Run ${BLUE}npx ts-node scripts/test-localnet.ts${NC} to test the wrapper"
echo -e "  2. Start frontend with ${BLUE}cd frontend && npm run dev${NC}"
echo -e "  3. Start API with ${BLUE}cd api && npx ts-node src/index.ts${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop the validator${NC}"
echo ""

# Keep the script running and tail the logs
tail -f "$PROJECT_ROOT/validator.log"
