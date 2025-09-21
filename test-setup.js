#!/usr/bin/env bun

// Test script to verify Bun setup and dependencies
const { ethers } = require("ethers");
require("dotenv").config();

console.log("🧪 Testing Monad Transfer Script Setup");
console.log("=====================================");
console.log("");

// Test 1: Check Bun version
console.log("1️⃣ Bun Version:");
console.log(`   Bun: ${process.version}`);
console.log("");

// Test 2: Check if dependencies are available
console.log("2️⃣ Dependencies:");
try {
  console.log(`   ✅ ethers: ${ethers.version}`);
} catch (error) {
  console.log(`   ❌ ethers: ${error.message}`);
}

try {
  require("dotenv");
  console.log("   ✅ dotenv: loaded");
} catch (error) {
  console.log(`   ❌ dotenv: ${error.message}`);
}
console.log("");

// Test 3: Check environment variables
console.log("3️⃣ Environment Variables:");
const requiredVars = ["WALLET_A_PRIVATE_KEY", "WALLET_B_PRIVATE_KEY", "WALLET_A_ADDRESS", "WALLET_B_ADDRESS"];
let envStatus = true;

requiredVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: set`);
  } else {
    console.log(`   ❌ ${varName}: not set`);
    envStatus = false;
  }
});
console.log("");

// Test 4: Test Monad Testnet connection
console.log("4️⃣ Monad Testnet Connection:");
async function testConnection() {
  try {
    const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to: ${network.name} (Chain ID: ${network.chainId})`);

    // Test a simple call
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Latest block: ${blockNumber}`);

    return true;
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

testConnection()
  .then((success) => {
    console.log("");
    console.log("📊 Setup Summary:");
    console.log(`   Bun: ✅ Ready`);
    console.log(`   Dependencies: ✅ Ready`);
    console.log(`   Environment: ${envStatus ? "✅ Ready" : "❌ Missing variables"}`);
    console.log(`   Network: ${success ? "✅ Connected" : "❌ Failed"}`);
    console.log("");

    if (envStatus && success) {
      console.log("🎉 Setup is complete! You can now run: bun start");
    } else {
      console.log("⚠️  Please fix the issues above before running the transfer script.");
      if (!envStatus) {
        console.log("   → Copy env.example to .env and fill in your details");
      }
    }
  })
  .catch((error) => {
    console.log(`   ❌ Test failed: ${error.message}`);
    process.exit(1);
  });
