# Monad Testnet Transfer Scripts

JavaScript scripts to perform transfer transactions on the Monad Testnet. Includes both single transfer and ping-pong transfer functionality.

## Scripts Available

1. **Single Transfer** (`transfer.js`) - Transfers all funds from wallet A to wallet B once
2. **Ping-Pong Transfer** (`ping-pong-transfer.js`) - Continuously transfers funds between wallet A and B until minimum amount remains, then transfers all back to wallet A

## Features

### Single Transfer Script
- ✅ Transfers all available funds from wallet A to wallet B
- ✅ Prevents transfers when amount < 0.5 MON
- ✅ Calculates gas fees automatically
- ✅ Uses private key from environment file
- ✅ Comprehensive error handling
- ✅ Transaction monitoring and confirmation
- ✅ Balance checking before and after transfer

### Ping-Pong Transfer Script
- ✅ Continuously transfers funds between wallet A and B
- ✅ Stops when transfer amount < 0.5 MON
- ✅ Automatically transfers all remaining funds back to wallet A
- ✅ Supports both wallet private keys
- ✅ Configurable maximum cycles and minimum amounts
- ✅ Real-time transfer statistics and logging
- ✅ Safety checks to prevent infinite loops
- ✅ **Recovery Mode**: Automatically detects and recovers stuck funds
- ✅ **Force Recovery**: Manual recovery option for stuck funds

## Network Configuration

- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz/
- **Chain ID**: 10143
- **Currency Symbol**: MON
- **Block Explorer**: https://testnet.monadexplorer.com/

## Installation

1. Install Bun (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file based on `env.example`:
```bash
cp env.example .env
```

4. Edit the `.env` file with your configuration:
```env
# For Single Transfer (only need wallet A private key)
PRIVATE_KEY=your_wallet_a_private_key_here
WALLET_A_ADDRESS=0x...
WALLET_B_ADDRESS=0x...

# For Ping-Pong Transfer (need both private keys)
WALLET_A_PRIVATE_KEY=your_wallet_a_private_key_here
WALLET_B_PRIVATE_KEY=your_wallet_b_private_key_here
WALLET_A_ADDRESS=0x...
WALLET_B_ADDRESS=0x...

# Optional: Ping-pong settings
MAX_CYCLES=100
MIN_REMAINING_AMOUNT=0.5
```

## Usage

### Single Transfer
```bash
bun start
# or
bun run transfer.js
```

### Ping-Pong Transfer
```bash
bun run ping-pong
# or
bun run ping-pong-transfer.js
```

### Recovery Mode
```bash
# Automatic recovery (detects stuck funds)
bun run ping-pong

# Force recovery mode
bun run recover
# or
bun run ping-pong-transfer.js --recover
```

### Development Mode
```bash
# Single transfer with auto-reload
bun dev

# Ping-pong transfer with auto-reload
bun run dev-ping-pong
```

### Setup & Testing
```bash
# Test your setup
bun test

# Quick installation (installs Bun + dependencies)
bun run install-bun
```

## How it Works

1. **Initialization**: Connects to Monad Testnet using the provided RPC URL
2. **Balance Check**: Retrieves the current balance of wallet A
3. **Gas Calculation**: Calculates the required gas fee for the transaction
4. **Amount Validation**: Ensures the available amount (after gas fees) is at least 0.5 MON
5. **Transaction**: Sends the maximum possible amount to wallet B
6. **Confirmation**: Waits for transaction confirmation and displays results

## Safety Features

- **Minimum Amount Check**: Prevents transfers when the available amount is less than 0.5 MON
- **Gas Fee Deduction**: Automatically deducts estimated gas fees from the transfer amount
- **Error Handling**: Comprehensive error handling for network issues and transaction failures
- **Balance Verification**: Shows balances before and after the transfer

## Example Output

```
🚀 Monad Testnet Transfer Script
================================

✅ Monad Transfer initialized successfully
📡 Connected to: Monad Testnet
🔗 RPC URL: https://testnet-rpc.monad.xyz/
👤 Wallet A: 0x1234...
👤 Wallet B: 0x5678...
💰 Currency: MON

🔄 Starting transfer process...
💰 Wallet A balance: 1.5 MON
⛽ Gas price: 20 Gwei
💸 Estimated fee: 0.00042 MON
📤 Available for transfer: 1.49958 MON
📝 Preparing transaction to send 1.49958 MON to 0x5678...
🚀 Transaction sent! Hash: 0xabcd...
🔍 Explorer: https://testnet.monadexplorer.com/tx/0xabcd...
⏳ Waiting for confirmation...
✅ Transaction confirmed successfully!
📊 Gas used: 21000
⛽ Gas price: 20 Gwei
💰 Total cost: 0.00042 MON

🎉 Transfer completed successfully!

📊 Final Balances:
💰 Wallet A: 0.0 MON
💰 Wallet B: 1.49958 MON
```

## Requirements

- Bun runtime (latest version recommended)
- Private key with access to wallet A
- Sufficient MON balance in wallet A (at least 0.5 MON + gas fees)

## Security Notes

- Never commit your `.env` file to version control
- Keep your private key secure
- Test with small amounts first
- This script is for Monad Testnet only

## Troubleshooting

- **"PRIVATE_KEY not found"**: Make sure your `.env` file exists and contains the private key
- **"Cannot transfer: Available amount is less than minimum"**: Wallet A needs at least 0.5 MON + gas fees
- **"Transaction failed"**: Check network connection and gas price settings
- **"Insufficient funds"**: Ensure wallet A has enough balance for gas fees
- **"Funds stuck in Wallet B"**: Use recovery mode: `bun run recover`
- **"Final transfer failed"**: Re-run the script - it will automatically detect and recover stuck funds
- **"Recovery mode detected"**: Script automatically found funds in Wallet B and will move them to Wallet A
