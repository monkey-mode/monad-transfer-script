const { ethers } = require("ethers");
require("dotenv").config();

// Monad Testnet Configuration
const MONAD_CONFIG = {
  name: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz/",
  chainId: 10143,
  currency: "MON",
  explorer: "https://testnet.monadexplorer.com/",
  gasLimit: 21000,
  gasPriceGwei: 20
};

// Ping-pong settings
const PING_PONG_CONFIG = {
  maxCycles: parseInt(process.env.MAX_CYCLES) || 100,
  minRemainingAmount: ethers.parseEther(process.env.MIN_REMAINING_AMOUNT || "0.5"),
  delayBetweenTransfers: parseInt(process.env.DELAY_BETWEEN_TRANSFERS) || 2000,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 5000
};

class PingPongTransfer {
  constructor() {
    this.provider = null;
    this.walletA = null;
    this.walletB = null;
    this.walletAAddress = null;
    this.walletBAddress = null;
    this.currentSender = null;
    this.currentReceiver = null;
    this.cycleCount = 0;
    this.totalTransfers = 0;
    this.totalFeesUsed = BigInt(0);
  }

  async initialize() {
    try {
      // Validate environment variables
      if (!process.env.WALLET_A_PRIVATE_KEY) {
        throw new Error("WALLET_A_PRIVATE_KEY not found in environment variables");
      }
      if (!process.env.WALLET_B_PRIVATE_KEY) {
        throw new Error("WALLET_B_PRIVATE_KEY not found in environment variables");
      }
      if (!process.env.WALLET_A_ADDRESS) {
        throw new Error("WALLET_A_ADDRESS not found in environment variables");
      }
      if (!process.env.WALLET_B_ADDRESS) {
        throw new Error("WALLET_B_ADDRESS not found in environment variables");
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(MONAD_CONFIG.rpcUrl);

      // Initialize wallets
      this.walletA = new ethers.Wallet(process.env.WALLET_A_PRIVATE_KEY, this.provider);
      this.walletB = new ethers.Wallet(process.env.WALLET_B_PRIVATE_KEY, this.provider);

      // Set wallet addresses
      this.walletAAddress = process.env.WALLET_A_ADDRESS;
      this.walletBAddress = process.env.WALLET_B_ADDRESS;

      // Verify wallet addresses match private keys
      if (this.walletA.address.toLowerCase() !== this.walletAAddress.toLowerCase()) {
        throw new Error("WALLET_A_ADDRESS does not match WALLET_A_PRIVATE_KEY");
      }
      if (this.walletB.address.toLowerCase() !== this.walletBAddress.toLowerCase()) {
        throw new Error("WALLET_B_ADDRESS does not match WALLET_B_PRIVATE_KEY");
      }

      console.log("✅ Ping-Pong Transfer initialized successfully");
      console.log(`📡 Connected to: ${MONAD_CONFIG.name}`);
      console.log(`🔗 RPC URL: ${MONAD_CONFIG.rpcUrl}`);
      console.log(`👤 Wallet A: ${this.walletAAddress}`);
      console.log(`👤 Wallet B: ${this.walletBAddress}`);
      console.log(`💰 Currency: ${MONAD_CONFIG.currency}`);
      console.log(`🔄 Max Cycles: ${PING_PONG_CONFIG.maxCycles}`);
      console.log(`💎 Min Remaining: ${ethers.formatEther(PING_PONG_CONFIG.minRemainingAmount)} ${MONAD_CONFIG.currency}`);
      console.log(`🔄 Max Retries: ${PING_PONG_CONFIG.maxRetries}`);
      console.log(`⏱️  Retry Delay: ${PING_PONG_CONFIG.retryDelay / 1000}s`);
      console.log("");
    } catch (error) {
      console.error("❌ Initialization failed:", error.message);
      process.exit(1);
    }
  }

  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return balance;
    } catch (error) {
      console.error(`❌ Failed to get balance for ${address}:`, error.message);
      return BigInt(0);
    }
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || ethers.parseUnits(MONAD_CONFIG.gasPriceGwei.toString(), "gwei");
    } catch (error) {
      console.error("❌ Failed to get gas price:", error.message);
      return ethers.parseUnits(MONAD_CONFIG.gasPriceGwei.toString(), "gwei");
    }
  }

  calculateTransferAmount(balance, gasPrice) {
    const gasLimit = BigInt(MONAD_CONFIG.gasLimit);
    const estimatedFee = gasPrice * gasLimit;

    // Calculate available amount after deducting gas fee
    const availableAmount = balance - estimatedFee;

    return {
      availableAmount,
      estimatedFee,
      canTransfer: availableAmount > BigInt(0)
    };
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async performTransferWithRetry(fromWallet, toAddress, fromAddress, transferName = "Transfer") {
    let lastError = null;

    for (let attempt = 1; attempt <= PING_PONG_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`🔄 ${transferName} - Attempt ${attempt}/${PING_PONG_CONFIG.maxRetries}`);

        const result = await this.performTransfer(fromWallet, toAddress, fromAddress);

        if (result.success) {
          if (attempt > 1) {
            console.log(`✅ ${transferName} succeeded on attempt ${attempt}`);
          }
          return result;
        }

        lastError = result;

        if (attempt < PING_PONG_CONFIG.maxRetries) {
          console.log(`❌ ${transferName} failed (${result.reason}). Retrying in ${PING_PONG_CONFIG.retryDelay / 1000} seconds...`);
          await this.sleep(PING_PONG_CONFIG.retryDelay);
        }
      } catch (error) {
        lastError = { success: false, reason: "error", error: error.message };

        if (attempt < PING_PONG_CONFIG.maxRetries) {
          console.log(`❌ ${transferName} error: ${error.message}. Retrying in ${PING_PONG_CONFIG.retryDelay / 1000} seconds...`);
          await this.sleep(PING_PONG_CONFIG.retryDelay);
        }
      }
    }

    console.log(`❌ ${transferName} failed after ${PING_PONG_CONFIG.maxRetries} attempts`);
    return lastError || { success: false, reason: "max_retries_exceeded" };
  }

  async performTransfer(fromWallet, toAddress, fromAddress) {
    try {
      // Get current balance
      const balance = await this.getBalance(fromAddress);
      const balanceInEther = ethers.formatEther(balance);

      console.log(`💰 ${fromAddress} balance: ${balanceInEther} ${MONAD_CONFIG.currency}`);

      // Get current gas price
      const gasPrice = await this.getGasPrice();
      const gasPriceInGwei = ethers.formatUnits(gasPrice, "gwei");

      // Calculate transfer amount
      const transferInfo = this.calculateTransferAmount(balance, gasPrice);
      const transferAmountInEther = ethers.formatEther(transferInfo.availableAmount);
      const feeInEther = ethers.formatEther(transferInfo.estimatedFee);

      console.log(`💸 Estimated fee: ${feeInEther} ${MONAD_CONFIG.currency}`);
      console.log(`📤 Available for transfer: ${transferAmountInEther} ${MONAD_CONFIG.currency}`);

      // Check if transfer is possible
      if (!transferInfo.canTransfer) {
        console.log(`❌ Cannot transfer: Insufficient balance for gas fees`);
        return { success: false, reason: "insufficient_balance" };
      }

      // Check if amount is below minimum threshold
      if (transferInfo.availableAmount < PING_PONG_CONFIG.minRemainingAmount) {
        console.log(`🛑 Transfer amount (${transferAmountInEther} ${MONAD_CONFIG.currency}) is below minimum threshold (${ethers.formatEther(PING_PONG_CONFIG.minRemainingAmount)} ${MONAD_CONFIG.currency})`);
        return { success: false, reason: "below_minimum" };
      }

      // Prepare transaction
      const transaction = {
        to: toAddress,
        value: transferInfo.availableAmount,
        gasLimit: MONAD_CONFIG.gasLimit,
        gasPrice: gasPrice
      };

      console.log(`📝 Preparing transaction to send ${transferAmountInEther} ${MONAD_CONFIG.currency} to ${toAddress}`);

      // Send transaction
      const txResponse = await fromWallet.sendTransaction(transaction);
      console.log(`🚀 Transaction sent! Hash: ${txResponse.hash}`);
      console.log(`🔍 Explorer: ${MONAD_CONFIG.explorer}/tx/${txResponse.hash}`);

      // Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      const receipt = await txResponse.wait();

      if (receipt.status === 1) {
        const actualFee = receipt.gasUsed * receipt.gasPrice;
        console.log("✅ Transaction confirmed successfully!");
        console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`⛽ Gas price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} Gwei`);
        console.log(`💰 Transaction fee: ${ethers.formatEther(actualFee)} ${MONAD_CONFIG.currency}`);
        return { success: true, amount: transferInfo.availableAmount, fee: actualFee };
      } else {
        console.log("❌ Transaction failed");
        return { success: false, reason: "transaction_failed" };
      }
    } catch (error) {
      console.error("❌ Transfer failed:", error.message);
      return { success: false, reason: "error", error: error.message };
    }
  }

  async performFinalTransfer() {
    console.log("");
    console.log("🏁 Performing final transfer - moving all funds back to Wallet A");
    console.log("=".repeat(60));

    const balanceB = await this.getBalance(this.walletBAddress);
    const balanceBInEther = ethers.formatEther(balanceB);

    if (balanceB === BigInt(0)) {
      console.log("✅ Wallet B already has zero balance");
      return true;
    }

    const result = await this.performTransfer(this.walletB, this.walletAAddress, this.walletBAddress);

    if (result.success) {
      if (result.fee) {
        this.totalFeesUsed += result.fee;
      }
      console.log("✅ Final transfer completed successfully!");
      return true;
    } else {
      console.log(`❌ Final transfer failed: ${result.reason}`);
      return false;
    }
  }

  async runPingPong() {
    console.log("🔄 Starting Ping-Pong Transfer Process");
    console.log("=".repeat(50));
    console.log("");

    // Start with Wallet A -> Wallet B
    this.currentSender = this.walletA;
    this.currentReceiver = this.walletBAddress;
    this.currentSenderAddress = this.walletAAddress;

    while (this.cycleCount < PING_PONG_CONFIG.maxCycles) {
      this.cycleCount++;
      console.log(`🔄 CYCLE ${this.cycleCount}/${PING_PONG_CONFIG.maxCycles}`);
      console.log(`📤 Transferring from ${this.currentSenderAddress} to ${this.currentReceiver === this.walletBAddress ? this.walletBAddress : this.walletAAddress}`);
      console.log("-".repeat(40));

      const result = await this.performTransferWithRetry(this.currentSender, this.currentReceiver, this.currentSenderAddress, `Cycle ${this.cycleCount} Transfer`);

      this.totalTransfers++;

      // Track fees for successful transfers
      if (result.success && result.fee) {
        this.totalFeesUsed += result.fee;
        console.log(`💰 Running total fees: ${ethers.formatEther(this.totalFeesUsed)} ${MONAD_CONFIG.currency}`);
      }

      if (!result.success) {
        if (result.reason === "below_minimum") {
          console.log(`🛑 Minimum threshold reached. Stopping ping-pong transfers.`);
          break;
        } else if (result.reason === "insufficient_balance") {
          console.log(`❌ Insufficient balance for gas fees. Stopping ping-pong transfers.`);
          break;
        } else {
          console.log(`❌ Transfer failed: ${result.reason}. Stopping ping-pong transfers.`);
          break;
        }
      }

      // Switch sender/receiver for next cycle
      if (this.currentSender === this.walletA) {
        this.currentSender = this.walletB;
        this.currentReceiver = this.walletAAddress;
        this.currentSenderAddress = this.walletBAddress;
      } else {
        this.currentSender = this.walletA;
        this.currentReceiver = this.walletBAddress;
        this.currentSenderAddress = this.walletAAddress;
      }

      // Add delay between transfers
      if (this.cycleCount < PING_PONG_CONFIG.maxCycles) {
        console.log(`⏱️  Waiting ${PING_PONG_CONFIG.delayBetweenTransfers / 1000} seconds before next transfer...`);
        await new Promise((resolve) => setTimeout(resolve, PING_PONG_CONFIG.delayBetweenTransfers));
        console.log("");
      }
    }

    // Perform final transfer back to Wallet A
    await this.performFinalTransfer();

    return true;
  }

  async showFinalBalances() {
    console.log("");
    console.log("📊 Final Balances:");
    console.log("=".repeat(30));

    const finalBalanceA = await this.getBalance(this.walletAAddress);
    const finalBalanceB = await this.getBalance(this.walletBAddress);

    console.log(`💰 Wallet A: ${ethers.formatEther(finalBalanceA)} ${MONAD_CONFIG.currency}`);
    console.log(`💰 Wallet B: ${ethers.formatEther(finalBalanceB)} ${MONAD_CONFIG.currency}`);
    console.log("");

    console.log("📈 Transfer Statistics:");
    console.log("=".repeat(30));
    console.log(`🔄 Total Cycles: ${this.cycleCount}`);
    console.log(`📤 Total Transfers: ${this.totalTransfers}`);
    console.log(`💰 Total Fees Used: ${ethers.formatEther(this.totalFeesUsed)} ${MONAD_CONFIG.currency}`);
    console.log(`⛽ Gas Price: ${MONAD_CONFIG.gasPriceGwei} Gwei`);
    console.log(`💎 Min Threshold: ${ethers.formatEther(PING_PONG_CONFIG.minRemainingAmount)} ${MONAD_CONFIG.currency}`);
  }

  async checkRecoveryMode() {
    const balanceA = await this.getBalance(this.walletAAddress);
    const balanceB = await this.getBalance(this.walletBAddress);

    // If wallet A is empty but wallet B has funds, we're in recovery mode
    if (balanceA === BigInt(0) && balanceB > BigInt(0)) {
      console.log("🔄 Recovery Mode Detected!");
      console.log("=".repeat(30));
      console.log(`💰 Wallet A: ${ethers.formatEther(balanceA)} ${MONAD_CONFIG.currency} (empty)`);
      console.log(`💰 Wallet B: ${ethers.formatEther(balanceB)} ${MONAD_CONFIG.currency} (has funds)`);
      console.log("");
      console.log("🔧 Attempting to recover funds from Wallet B to Wallet A...");
      console.log("");

      return true;
    }

    return false;
  }

  async runRecoveryMode() {
    console.log("🚨 RECOVERY MODE - Transferring all funds from B to A");
    console.log("=".repeat(50));

    const result = await this.performTransferWithRetry(this.walletB, this.walletAAddress, this.walletBAddress, "Recovery Transfer");

    if (result.success) {
      if (result.fee) {
        this.totalFeesUsed += result.fee;
      }
      console.log("✅ Recovery transfer completed successfully!");
      console.log("🎉 All funds have been moved back to Wallet A");
      return true;
    } else {
      console.log(`❌ Recovery transfer failed after ${PING_PONG_CONFIG.maxRetries} attempts: ${result.reason}`);
      console.log("💡 You may need to manually transfer funds or check gas prices");
      return false;
    }
  }

  async run() {
    console.log("🚀 Monad Testnet Ping-Pong Transfer Script");
    console.log("==========================================");
    console.log("");

    await this.initialize();

    // Check for recovery mode command line argument
    const isForceRecovery = process.argv.includes("--recover") || process.argv.includes("-r");
    if (isForceRecovery) {
      console.log("🔧 Force Recovery Mode Enabled");
      console.log("=".repeat(30));
      const recoverySuccess = await this.runRecoveryMode();
      if (recoverySuccess) {
        await this.showFinalBalances();
      }
      return;
    }

    // Check initial balances
    const initialBalanceA = await this.getBalance(this.walletAAddress);
    const initialBalanceB = await this.getBalance(this.walletBAddress);

    console.log("💰 Initial Balances:");
    console.log(`   Wallet A: ${ethers.formatEther(initialBalanceA)} ${MONAD_CONFIG.currency}`);
    console.log(`   Wallet B: ${ethers.formatEther(initialBalanceB)} ${MONAD_CONFIG.currency}`);
    console.log("");

    if (initialBalanceA === BigInt(0) && initialBalanceB === BigInt(0)) {
      console.log("❌ Both wallets have zero balance. Please fund at least one wallet first.");
      return;
    }

    // Check if we need to run in recovery mode
    const isRecoveryMode = await this.checkRecoveryMode();

    if (isRecoveryMode) {
      const recoverySuccess = await this.runRecoveryMode();
      if (recoverySuccess) {
        await this.showFinalBalances();
      }
      return;
    }

    // Run ping-pong transfers
    const success = await this.runPingPong();

    if (success) {
      console.log("");
      console.log("🎉 Ping-Pong Transfer completed successfully!");
      await this.showFinalBalances();
    } else {
      console.log("");
      console.log("❌ Ping-Pong Transfer failed. Please check the logs above for details.");
      console.log("");
      console.log("💡 If funds are stuck in Wallet B, you can re-run this script to recover them.");
    }
  }
}

// Main execution
async function main() {
  const pingPongTransfer = new PingPongTransfer();
  await pingPongTransfer.run();
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
}

module.exports = PingPongTransfer;
