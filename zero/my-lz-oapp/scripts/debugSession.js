const hre = require("hardhat");

async function main() {
  console.log('🔍 DEBUGGING SESSION MODULE');
  console.log('===========================');
  
  const [deployer] = await hre.ethers.getSigners();
  const sessionPrivateKey = "0xb6feb2f71790ffbbf7077310335af3b19eee0200efc47754abe2950996d85ecc";
  const sessionWallet = new hre.ethers.Wallet(sessionPrivateKey);
  
  // Get wallet address
  const walletFactory = await hre.ethers.getContractAt("WalletFactory", "0x26cEb980e7cDF029f45F3Bf779EFf94A3482c368");
  const salt = await walletFactory.generateSalt(deployer.address, 11155111);
  const walletAddr = await walletFactory.getWalletAddress(deployer.address, salt);
  
  console.log("User:", deployer.address);
  console.log("Session signer:", sessionWallet.address);
  console.log("Wallet:", walletAddr);
  
  // Check session module
  const sessionModuleAddr = await walletFactory.sessionModule();
  const sessionModule = await hre.ethers.getContractAt("SessionModule", sessionModuleAddr);
  
  console.log("SessionModule:", sessionModuleAddr);
  
  // Check session details
  const session = await sessionModule.getSession(walletAddr);
  console.log('\n📋 Current session:');
  console.log('   Session PubKey:', session.sessionPubKey);
  console.log('   Expiry:', new Date(session.expiry * 1000).toISOString());
  console.log('   Active:', session.isActive);
  
  // Check token limit
  const tokenLimit = await sessionModule.getTokenLimit(walletAddr, hre.ethers.constants.AddressZero);
  console.log('   ETH Limit:', hre.ethers.utils.formatEther(tokenLimit), 'ETH');
  
  // Check escrow permission
  const escrowAddr = "0x22F6da0D9C65715DA3c985a2Bd7A5c134E6999e5";
  const isAllowed = await sessionModule.isEscrowAllowed(walletAddr, escrowAddr);
  console.log('   Escrow allowed:', isAllowed);
  
  // Test signature creation and verification
  console.log('\n🔐 Testing signature verification...');
  
  const amount = hre.ethers.utils.parseEther("0.03");
  const escrowInterface = new hre.ethers.utils.Interface(["function depositNative() payable"]);
  const callData = escrowInterface.encodeFunctionData('depositNative', []);
  
  // Create message hash (same as in SessionModule)
  const messageHash = hre.ethers.utils.keccak256(
    hre.ethers.utils.solidityPack(
      ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
      [walletAddr, escrowAddr, hre.ethers.constants.AddressZero, amount, callData, 11155111]
    )
  );
  
  console.log('📝 Message hash:', messageHash);
  
  // Sign with session wallet
  const signature = await sessionWallet.signMessage(hre.ethers.utils.arrayify(messageHash));
  console.log('✍️  Signature:', signature.slice(0, 20) + '...');
  
  // Try to verify via SessionModule directly
  try {
    console.log('\n🧪 Testing SessionModule.verifyAndExecute...');
    
    const result = await sessionModule.callStatic.verifyAndExecute(
      walletAddr,
      escrowAddr,
      hre.ethers.constants.AddressZero,
      amount,
      callData,
      signature
    );
    
    console.log('✅ SessionModule verification successful!');
    console.log('   Success:', result.success);
    console.log('   Return data length:', result.returnData.length);
    
  } catch (verifyError) {
    console.log('❌ SessionModule verification failed:', verifyError.message);
    
    // Decode error if possible
    if (verifyError.data) {
      console.log('Error data:', verifyError.data);
    }
    
    // Try with different signature approach
    console.log('\n🔄 Trying with eth_sign style signature...');
    const ethSignedHash = hre.ethers.utils.hashMessage(hre.ethers.utils.arrayify(messageHash));
    const signature2 = await sessionWallet.signMessage(hre.ethers.utils.arrayify(messageHash));
    
    try {
      const result2 = await sessionModule.callStatic.verifyAndExecute(
        walletAddr,
        escrowAddr,
        hre.ethers.constants.AddressZero,
        amount,
        callData,
        signature2
      );
      console.log('✅ Second signature attempt successful!');
    } catch (error2) {
      console.log('❌ Second signature also failed:', error2.message);
    }
  }
}

main().catch(console.error);
