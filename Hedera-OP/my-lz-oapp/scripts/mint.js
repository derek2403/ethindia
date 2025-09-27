const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Minting with account:", signer.address);
    
    // Sepolia MyOFT contract address
    const sepoliaOFT = await ethers.getContractAt("MyOFT", "0x61397e1401f8835c1B90622f70F1Fec81068800A");
    
    // Mint 1000 tokens
    console.log("Minting 1000 tokens on Sepolia...");
    const tx = await sepoliaOFT.mint(signer.address, ethers.utils.parseEther("1000"));
    await tx.wait();
    
    // Check balance
    const balance = await sepoliaOFT.balanceOf(signer.address);
    console.log("Balance:", ethers.utils.formatEther(balance), "tokens");
    
    console.log("✅ Minting completed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
