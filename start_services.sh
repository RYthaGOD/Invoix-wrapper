#!/bin/bash
# start_services.sh

echo "Purging old processes and clearing ports..."
pkill -f solana-test-validator || true
pkill -f node || true
fuser -k 8899/tcp 8900/tcp 9900/tcp 3001/tcp || true
sleep 3

echo "Starting Validator (resetting ledger)..."
solana-test-validator --reset --quiet > validator.log 2>&1 &

# Wait for validator to be ready
echo "Waiting for validator..."
MAX_RETRIES=30
COUNT=0
until solana cluster-version >/dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
    sleep 2
    COUNT=$((COUNT+1))
    echo -n "."
done
echo ""

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "Validator failed to start. Check validator.log"
    exit 1
fi

echo "Validator up. Configuring CLI..."
solana config set --url localhost

echo "Airdropping SOL to CLI authority..."
solana airdrop 10

echo "Deploying program..."
anchor deploy

echo "Starting API server..."
cd api && npm run dev > api.log 2>&1 &

echo "Services started successfully."
