# Monad Testnet Transfer Script

A JavaScript script to perform transfer transactions on the Monad Testnet, transferring all available funds from wallet A to wallet B while ensuring the transfer amount is at least 0.5 MON.

## Features

- ✅ Transfers all available funds from wallet A to wallet B
- ✅ Prevents transfers when amount < 0.5 MON
- ✅ Calculates gas fees automatically
- ✅ Uses private key from environment file
- ✅ Comprehensive error handling
- ✅ Transaction monitoring and confirmation
- ✅ Balance checking before and after transfer

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
PRIVATE_KEY=your_private_key_here
WALLET_A_ADDRESS=0x...
WALLET_B_ADDRESS=0x...
```

## Usage

Run the transfer script:
```bash
bun start
```

Or directly with Bun:
```bash
bun run transfer.js
```

For development with auto-reload:
```bash
bun dev
```

Test your setup:
```bash
bun test
```

Quick installation (installs Bun + dependencies):
```bash
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
