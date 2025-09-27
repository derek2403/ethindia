const hre = require("hardhat");

async function main() {
  // Connect to Sepolia
  console.log("🔍 Testing WalletFactory on Sepolia...");
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);
  
  // Check WalletFactory deployment
  const walletFactoryAddr = "0x26cEb980e7cDF029f45F3Bf779EFf94A3482c368";
  const code = await hre.ethers.provider.getCode(walletFactoryAddr);
  console.log("WalletFactory code length:", code.length);
  
  if (code === "0x") {
    console.log("❌ WalletFactory not deployed at", walletFactoryAddr);
    return;
  }
  
  console.log("✅ WalletFactory contract exists");
  
  // Test the function call
  const walletFactory = await hre.ethers.getContractAt("WalletFactory", walletFactoryAddr);
  
  try {
    console.log("Testing generateSalt...");
    const salt = await walletFactory.generateSalt(signer.address, 11155111);
    console.log("✅ generateSalt successful:", salt);
    
    console.log("Testing getWalletAddress...");
    const walletAddr = await walletFactory.getWalletAddress(signer.address, salt);
    console.log("✅ getWalletAddress successful:", walletAddr);
    
    // Test SessionModule address
    const sessionModuleAddr = await walletFactory.sessionModule();
    console.log("✅ SessionModule address:", sessionModuleAddr);
    
  } catch (error) {
    console.log("❌ Function call failed:", error.message);
    console.log("Full error:", error);
  }
}

main().catch(console.error);
