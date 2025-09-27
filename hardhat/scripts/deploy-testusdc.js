const hre = require("hardhat");

async function main() {
  console.log("Starting TestUSDC deployment...");

  // Get the contract factory
  const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");

  // Deploy the contract
  console.log("Deploying TestUSDC...");
  const testUSDC = await TestUSDC.deploy();

  // Wait for the contract to be deployed
  await testUSDC.waitForDeployment();

  const contractAddress = await testUSDC.getAddress();

  console.log("TestUSDC deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Network:", hre.network.name);
  
  // Get deployment info
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployed by:", deployer.address);
  
  // Verify initial supply
  const totalSupply = await testUSDC.totalSupply();
  const decimals = await testUSDC.decimals();
  const balance = await testUSDC.balanceOf(deployer.address);
  
  console.log("Total supply:", hre.ethers.formatUnits(totalSupply, decimals), "USDC");
  console.log("Deployer balance:", hre.ethers.formatUnits(balance, decimals), "USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
