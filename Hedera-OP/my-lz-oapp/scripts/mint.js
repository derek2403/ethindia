const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Minting with account:", signer.address);
    
    // Sepolia USDC contract address (new deployment)
    const sepoliaUSDC = await ethers.getContractAt("MyOFT", "0x3EA7dFee7a515D9B5dFe5699f6cc2ce2EEcc7807");
    
    // Mint 1000 USDC tokens
    console.log("Minting 1000 USDC tokens on Sepolia...");
    const tx = await sepoliaUSDC.mint(signer.address, ethers.utils.parseEther("1000"));
    await tx.wait();
    
    // Check balance
    const balance = await sepoliaUSDC.balanceOf(signer.address);
    console.log("Balance:", ethers.utils.formatEther(balance), "USDC");
    
    console.log("✅ USDC minting completed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
