// scripts/deploy-escrow.js
const hre = require("hardhat");

async function main() {
  console.log("Starting Escrow deployment...");

  // 1) Get a funded signer from your hedera_testnet config (accounts[])
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  // 2) Attach signer to the factory (ethers v6)
  const Escrow = await hre.ethers.getContractFactory("Escrow", deployer);

  // 3) Deploy (add constructor args if your Escrow needs them)
  console.log("Deploying Escrow...");
  const escrow = await Escrow.deploy(/* constructor args if any */);
  const deployTx = escrow.deploymentTransaction();
  if (deployTx) console.log("Deploy tx hash:", deployTx.hash);

  // 4) Wait for deployment and print address
  await escrow.waitForDeployment();
  const contractAddress = await escrow.getAddress();
  console.log("Escrow deployed successfully!");
  console.log("Contract address:", contractAddress);

  // 5) (Optional) verify a read call, but guard it so it doesn't crash if empty
  try {
    const merchantTokens = await escrow.viewEscrow(deployer.address);
    // Adjust this if your function returns a different shape
    const count = Array.isArray(merchantTokens) && merchantTokens[0]?.length !== undefined
      ? merchantTokens[0].length
      : (merchantTokens?.length ?? 0);
    console.log("Contract verification OK — viewEscrow() returned items:", count);
  } catch (err) {
    console.log("Skipping viewEscrow check (call failed):", err.shortMessage || err.message);
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("Error during deployment:", error);
  process.exit(1);
});
