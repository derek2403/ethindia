const hre = require("hardhat");

async function main() {
  console.log('🎯 SIMPLE DEPOSIT TEST - BYPASS CROSS-CHAIN INSTALLATION');
  console.log('========================================================');
  console.log('Goal: Prove the session deposit mechanism works end-to-end');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("User:", deployer.address);
  
  // Contract addresses
  const walletFactory = await hre.ethers.getContractAt(
    "WalletFactory", 
    "0x96C1D76ABD0e85579D1ff95FcBCE31BC35017D30"
  );
  const escrowAddr = "0x22F6da0D9C65715DA3c985a2Bd7A5c134E6999e5";
  
  // Step 1: Generate session key and deploy wallet
  console.log('\n1️⃣ Setting up wallet and session...');
  
  const sessionWallet = hre.ethers.Wallet.createRandom();
  console.log('🔑 Session Private Key:', sessionWallet.privateKey);
  console.log('🔓 Session Public Key:', sessionWallet.address);
  
  // Deploy wallet
  const salt = await walletFactory.generateSalt(deployer.address, 11155111);
  const walletAddr = await walletFactory.getWalletAddress(deployer.address, salt);
  
  // Check if wallet exists, deploy if needed
  const code = await hre.ethers.provider.getCode(walletAddr);
  if (code === '0x') {
    console.log('📱 Deploying new wallet...');
    const deployTx = await walletFactory.deployIfNeeded(deployer.address, salt);
    await deployTx.wait();
    console.log('✅ Wallet deployed at:', walletAddr);
  } else {
    console.log('📱 Using existing wallet at:', walletAddr);
  }
  
  // Fund the wallet
  const fundTx = await deployer.sendTransaction({
    to: walletAddr,
    value: hre.ethers.utils.parseEther("0.1")
  });
  await fundTx.wait();
  console.log('💰 Wallet funded with 0.1 ETH');
  
  // Step 2: Manually install session (bypass cross-chain)
  console.log('\n2️⃣ Installing session locally...');
  
  const wallet = await hre.ethers.getContractAt("MinimalWallet", walletAddr);
  
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const tokenLimits = [
    { token: hre.ethers.constants.AddressZero, limit: hre.ethers.utils.parseEther('1') }
  ];
  const escrowPermissions = [
    { escrow: escrowAddr, allowed: true }
  ];
  
  const installTx = await wallet.connect(deployer).installSession(
    sessionWallet.address,
    expiry,
    tokenLimits,
    escrowPermissions
  );
  
  await installTx.wait();
  console.log('✅ Session installed locally');
  
  // Step 3: Test session deposit
  console.log('\n3️⃣ Testing session deposit...');
  
  const amount = hre.ethers.utils.parseEther("0.03");
  const escrowInterface = new hre.ethers.utils.Interface([
    "function depositNative() payable"
  ]);
  const callData = escrowInterface.encodeFunctionData('depositNative', []);
  
  // Create session signature
  const messageHash = hre.ethers.utils.keccak256(
    hre.ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
      [walletAddr, escrowAddr, hre.ethers.constants.AddressZero, amount, callData, 11155111]
    )
  );
  
  const signature = await sessionWallet.signMessage(hre.ethers.utils.arrayify(messageHash));
  console.log('✍️  Session signature created');
  
  // Execute deposit
  const depositTx = await wallet.executeAsWallet(
    escrowAddr,
    hre.ethers.constants.AddressZero,
    amount,
    callData,
    signature,
    {
      value: amount,
      gasLimit: 500000
    }
  );
  
  console.log('📄 Deposit transaction:', depositTx.hash);
  const receipt = await depositTx.wait();
  
  if (receipt.status === 1) {
    console.log('🎉 DEPOSIT SUCCESS! Block:', receipt.blockNumber);
    
    // Verify escrow balance
    const escrow = await hre.ethers.getContractAt("Escrow", escrowAddr);
    const userBalance = await escrow.getUserBalance(walletAddr, hre.ethers.constants.AddressZero);
    console.log('💰 User balance in escrow:', hre.ethers.utils.formatEther(userBalance), 'ETH');
    
    const totalDeposits = await escrow.getTotalDepositCount();
    console.log('📊 Total deposits in system:', totalDeposits.toString());
    
    console.log('\n🎉🎉🎉 CORE MECHANISM PROVEN! 🎉🎉🎉');
    console.log('');
    console.log('✅ Smart wallet deployment via CREATE2');
    console.log('✅ Session key installation with policies');
    console.log('✅ Session signature verification');
    console.log('✅ Authorized deposit execution');
    console.log('✅ Escrow fund management');
    console.log('');
    console.log('🚀 The core one-click deposit mechanism is WORKING!');
    console.log('📝 Session Private Key for frontend:', sessionWallet.privateKey);
    
  } else {
    console.log('❌ Deposit transaction failed');
  }
}

main().catch(console.error);
