#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SPL Token-2022 Build Script (zk-ops)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
TEMP_DIR="/tmp/spl-token2022-build"
SPL_REPO="https://github.com/solana-labs/solana-program-library.git"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/target/deploy"
TOKEN_PROGRAM_NAME="spl_token_2022.so"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo -e "${YELLOW}📦 Configuration:${NC}"
echo -e "  Temp Directory: $TEMP_DIR"
echo -e "  Project Root: $PROJECT_ROOT"
echo -e "  Target Directory: $TARGET_DIR"
echo ""

# Clean up any existing temp directory
if [ -d "$TEMP_DIR" ]; then
    echo -e "${YELLOW}🧹 Cleaning up existing temp directory...${NC}"
    rm -rf "$TEMP_DIR"
fi

# Clone the repository
echo -e "${BLUE}📥 Cloning solana-program-library...${NC}"
git clone --depth 1 "$SPL_REPO" "$TEMP_DIR"
cd "$TEMP_DIR"

# Navigate to token-2022 program
echo -e "${BLUE}📂 Navigating to token/program-2022...${NC}"
cd token/program-2022

# Check if zk-ops feature exists in Cargo.toml
if ! grep -q "zk-ops" Cargo.toml; then
    echo -e "${RED}❌ Error: zk-ops feature not found in Cargo.toml${NC}"
    echo -e "${YELLOW}This might indicate a version mismatch or the feature has been renamed.${NC}"
    echo -e "${YELLOW}Attempting to build anyway...${NC}"
fi

# Build with zk-ops feature
echo -e "${BLUE}🔨 Building spl-token-2022 with zk-ops feature...${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"
echo ""

if cargo build-sbf --features zk-ops; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${YELLOW}Attempting build without zk-ops flag as fallback...${NC}"
    cargo build-sbf
fi

# Find the compiled .so file
BUILT_SO=$(find target/deploy -name "$TOKEN_PROGRAM_NAME" | head -n 1)

if [ -z "$BUILT_SO" ]; then
    echo -e "${RED}❌ Error: Could not find compiled $TOKEN_PROGRAM_NAME${NC}"
    echo -e "${YELLOW}Listing target/deploy contents:${NC}"
    ls -la target/deploy/
    exit 1
fi

echo -e "${GREEN}📦 Found compiled program: $BUILT_SO${NC}"

# Copy to project directory
echo -e "${BLUE}📋 Copying to project target directory...${NC}"
cp "$BUILT_SO" "$TARGET_DIR/"

# Verify copy
if [ -f "$TARGET_DIR/$TOKEN_PROGRAM_NAME" ]; then
    FILE_SIZE=$(du -h "$TARGET_DIR/$TOKEN_PROGRAM_NAME" | cut -f1)
    echo -e "${GREEN}✅ Successfully copied to: $TARGET_DIR/$TOKEN_PROGRAM_NAME${NC}"
    echo -e "${GREEN}   File size: $FILE_SIZE${NC}"
else
    echo -e "${RED}❌ Error: Failed to copy file${NC}"
    exit 1
fi

# Clean up temp directory
echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
cd "$PROJECT_ROOT"
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run ${BLUE}./scripts/start-localnet.sh${NC} to start the validator"
echo -e "  2. Deploy your wrapper program with ${BLUE}anchor deploy --provider.cluster localnet${NC}"
echo -e "  3. Run tests with ${BLUE}npx ts-node scripts/test-localnet.ts${NC}"
echo ""
echo -e "${YELLOW}Token-2022 Program Location:${NC}"
echo -e "  $TARGET_DIR/$TOKEN_PROGRAM_NAME"
echo ""
