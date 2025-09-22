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

// Minimum transfer amount (0.5 MON)
const MIN_TRANSFER_AMOUNT = ethers.parseEther("0.5");

// Retry settings
const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 5000
};

class MonadTransfer {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.walletA = null;
    this.walletB = null;
    this.totalFeesUsed = BigInt(0);
  }

  async initialize() {
    try {
      // Validate environment variables
      if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not found in environment variables");
      }
      if (!process.env.WALLET_A_ADDRESS) {
        throw new Error("WALLET_A_ADDRESS not found in environment variables");
      }
      if (!process.env.WALLET_B_ADDRESS) {
        throw new Error("WALLET_B_ADDRESS not found in environment variables");
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(MONAD_CONFIG.rpcUrl);

      // Initialize wallet from private key
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // Set wallet addresses
      this.walletA = process.env.WALLET_A_ADDRESS;
      this.walletB = process.env.WALLET_B_ADDRESS;

      console.log("✅ Monad Transfer initialized successfully");
      console.log(`📡 Connected to: ${MONAD_CONFIG.name}`);
      console.log(`🔗 RPC URL: ${MONAD_CONFIG.rpcUrl}`);
      console.log(`👤 Wallet A: ${this.walletA}`);
      console.log(`👤 Wallet B: ${this.walletB}`);
      console.log(`💰 Currency: ${MONAD_CONFIG.currency}`);
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
      canTransfer: availableAmount >= MIN_TRANSFER_AMOUNT
    };
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async performTransferWithRetry() {
    let lastError = null;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`🔄 Transfer - Attempt ${attempt}/${RETRY_CONFIG.maxRetries}`);

        const result = await this.performTransfer();

        if (result) {
          if (attempt > 1) {
            console.log(`✅ Transfer succeeded on attempt ${attempt}`);
          }
          return result;
        }

        lastError = false;

        if (attempt < RETRY_CONFIG.maxRetries) {
          console.log(`❌ Transfer failed. Retrying in ${RETRY_CONFIG.retryDelay / 1000} seconds...`);
          await this.sleep(RETRY_CONFIG.retryDelay);
        }
      } catch (error) {
        lastError = false;

        if (attempt < RETRY_CONFIG.maxRetries) {
          console.log(`❌ Transfer error: ${error.message}. Retrying in ${RETRY_CONFIG.retryDelay / 1000} seconds...`);
          await this.sleep(RETRY_CONFIG.retryDelay);
        }
      }
    }

    console.log(`❌ Transfer failed after ${RETRY_CONFIG.maxRetries} attempts`);
    return false;
  }

  async performTransfer() {
    try {
      console.log("🔄 Starting transfer process...");

      // Get current balance of wallet A
      const balance = await this.getBalance(this.walletA);
      const balanceInEther = ethers.formatEther(balance);

      console.log(`💰 Wallet A balance: ${balanceInEther} ${MONAD_CONFIG.currency}`);

      // Get current gas price
      const gasPrice = await this.getGasPrice();
      const gasPriceInGwei = ethers.formatUnits(gasPrice, "gwei");

      console.log(`⛽ Gas price: ${gasPriceInGwei} Gwei`);

      // Calculate transfer amount
      const transferInfo = this.calculateTransferAmount(balance, gasPrice);
      const transferAmountInEther = ethers.formatEther(transferInfo.availableAmount);
      const feeInEther = ethers.formatEther(transferInfo.estimatedFee);

      console.log(`💸 Estimated fee: ${feeInEther} ${MONAD_CONFIG.currency}`);
      console.log(`📤 Available for transfer: ${transferAmountInEther} ${MONAD_CONFIG.currency}`);

      // Check if transfer is possible
      if (!transferInfo.canTransfer) {
        console.log(`❌ Cannot transfer: Available amount (${transferAmountInEther} ${MONAD_CONFIG.currency}) is less than minimum required (0.5 ${MONAD_CONFIG.currency})`);
        return false;
      }

      // Prepare transaction
      const transaction = {
        to: this.walletB,
        value: transferInfo.availableAmount,
        gasLimit: MONAD_CONFIG.gasLimit,
        gasPrice: gasPrice
      };

      console.log(`📝 Preparing transaction to send ${transferAmountInEther} ${MONAD_CONFIG.currency} to ${this.walletB}`);

      // Send transaction
      const txResponse = await this.wallet.sendTransaction(transaction);
      console.log(`🚀 Transaction sent! Hash: ${txResponse.hash}`);
      console.log(`🔍 Explorer: ${MONAD_CONFIG.explorer}/tx/${txResponse.hash}`);

      // Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      const receipt = await txResponse.wait();

      if (receipt.status === 1) {
        const actualFee = receipt.gasUsed * receipt.gasPrice;
        this.totalFeesUsed += actualFee;
        console.log("✅ Transaction confirmed successfully!");
        console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`⛽ Gas price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} Gwei`);
        console.log(`💰 Transaction fee: ${ethers.formatEther(actualFee)} ${MONAD_CONFIG.currency}`);
        console.log(`💰 Total fees used: ${ethers.formatEther(this.totalFeesUsed)} ${MONAD_CONFIG.currency}`);
        return true;
      } else {
        console.log("❌ Transaction failed");
        return false;
      }
    } catch (error) {
      console.error("❌ Transfer failed:", error.message);
      return false;
    }
  }

  async run() {
    console.log("🚀 Monad Testnet Transfer Script");
    console.log("================================");
    console.log("");

    await this.initialize();

    // Check if wallet A has sufficient balance
    const balance = await this.getBalance(this.walletA);
    if (balance === BigInt(0)) {
      console.log("❌ Wallet A has no balance. Please fund the wallet first.");
      return;
    }

    // Perform the transfer with retry
    const success = await this.performTransferWithRetry();

    if (success) {
      console.log("");
      console.log("🎉 Transfer completed successfully!");

      // Show final balances
      const finalBalanceA = await this.getBalance(this.walletA);
      const finalBalanceB = await this.getBalance(this.walletB);

      console.log("");
      console.log("📊 Final Balances:");
      console.log(`💰 Wallet A: ${ethers.formatEther(finalBalanceA)} ${MONAD_CONFIG.currency}`);
      console.log(`💰 Wallet B: ${ethers.formatEther(finalBalanceB)} ${MONAD_CONFIG.currency}`);
      console.log("");
      console.log("📈 Transfer Statistics:");
      console.log(`💰 Total Fees Used: ${ethers.formatEther(this.totalFeesUsed)} ${MONAD_CONFIG.currency}`);
    } else {
      console.log("");
      console.log("❌ Transfer failed. Please check the logs above for details.");
    }
  }
}

// Main execution
async function main() {
  const transfer = new MonadTransfer();
  await transfer.run();
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

module.exports = MonadTransfer;
