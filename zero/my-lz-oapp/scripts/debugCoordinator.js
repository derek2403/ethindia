const hre = require("hardhat");

async function main() {
  console.log("🔍 Verifying Sepolia deployments...");
  
  // Check all deployed contracts
  const contracts = {
    Coordinator: "0x0325f7C3BCD3D7039eB247336A00E06aaa395021",
    WalletFactory: "0x26cEb980e7cDF029f45F3Bf779EFf94A3482c368",
    SessionModule: "0x4d2261E270f85EE92bcB14623199D352FB9392E2",
    Escrow: "0x22F6da0D9C65715DA3c985a2Bd7A5c134E6999e5"
  };
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with signer:", signer.address);
  
  for (const [name, address] of Object.entries(contracts)) {
    const code = await hre.ethers.provider.getCode(address);
    console.log(`${name}: ${address} - ${code === '0x' ? '❌ NOT DEPLOYED' : '✅ DEPLOYED'}`);
  }
  
  // Test Coordinator with deployer address (known to work)
  const coordinator = await hre.ethers.getContractAt("Coordinator", contracts.Coordinator);
  
  try {
    console.log(`\n🧪 Testing Coordinator functions...`);
    
    // Test with deployer address first
    const nonce1 = await coordinator.getUserNonce(signer.address);
    console.log(`✅ getUserNonce(${signer.address}):`, nonce1.toString());
    
    // Test with a properly formatted address 
    const testAddress = "0xEE09f3e2Ca67E4705f5d5B1d90E8E4Fbee5977e3e"; // Fixed checksum
    const nonce2 = await coordinator.getUserNonce(testAddress);
    console.log(`✅ getUserNonce(${testAddress}):`, nonce2.toString());
    
    const domainSeparator = await coordinator.DOMAIN_SEPARATOR();
    console.log("✅ DOMAIN_SEPARATOR:", domainSeparator);
    
    const walletFactoryAddr = await coordinator.walletFactory();
    console.log("✅ WalletFactory address:", walletFactoryAddr);
    
    console.log("\n📋 Frontend should use these exact contract addresses:");
    console.log("SEPOLIA_COORDINATOR_ADDRESS =", `"${contracts.Coordinator}"`);
    console.log("SEPOLIA_WALLET_FACTORY_ADDRESS =", `"${contracts.WalletFactory}"`);
    
  } catch (error) {
    console.log("❌ Coordinator function test failed:", error.message);
    console.log("Full error:", error);
  }
}

main().catch(console.error);
