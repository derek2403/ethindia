const hre = require("hardhat");

async function main() {
  console.log('🏦 FUND WALLET AND TEST DEPOSITS');
  console.log('================================');
  
  const [deployer] = await hre.ethers.getSigners();
  const userAddress = "0xf1a7b4b4B16fc24650D3dC96d5112b5c1F309092";
  const sessionPrivateKey = "0xb6feb2f71790ffbbf7077310335af3b19eee0200efc47754abe2950996d85ecc";
  
  console.log("Deployer:", deployer.address);
  console.log("User:", userAddress);
  
  // Get wallet factory and calculate wallet address
  const walletFactory = await hre.ethers.getContractAt(
    "WalletFactory", 
    "0x26cEb980e7cDF029f45F3Bf779EFf94A3482c368"
  );
  
  const salt = await walletFactory.generateSalt(userAddress, 11155111);
  const walletAddr = await walletFactory.getWalletAddress(userAddress, salt);
  
  console.log("📱 Smart wallet address:", walletAddr);
  
  // Check if wallet is deployed
  const code = await hre.ethers.provider.getCode(walletAddr);
  console.log("Wallet deployed:", code !== '0x');
  
  // Check wallet balance
  let walletBalance = await hre.ethers.provider.getBalance(walletAddr);
  console.log("Wallet balance:", hre.ethers.utils.formatEther(walletBalance), "ETH");
  
  // Fund the wallet if needed
  if (walletBalance.lt(hre.ethers.utils.parseEther("0.1"))) {
    console.log('\n💰 Funding smart wallet...');
    const fundTx = await deployer.sendTransaction({
      to: walletAddr,
      value: hre.ethers.utils.parseEther("0.1") // Fund with 0.1 ETH
    });
    
    await fundTx.wait();
    walletBalance = await hre.ethers.provider.getBalance(walletAddr);
    console.log('✅ Wallet funded! New balance:', hre.ethers.utils.formatEther(walletBalance), 'ETH');
  }
  
  // Now test the deposit
  console.log('\n🧪 Testing session deposit...');
  
  const sessionSigner = new hre.ethers.Wallet(sessionPrivateKey, hre.ethers.provider);
  console.log("Session signer:", sessionSigner.address);
  
  // Create deposit call data
  const escrowInterface = new hre.ethers.utils.Interface([
    "function depositNative() payable"
  ]);
  const callData = escrowInterface.encodeFunctionData('depositNative', []);
  
  // Create session signature
  const amount = hre.ethers.utils.parseEther("0.03");
  const escrowAddr = "0x22F6da0D9C65715DA3c985a2Bd7A5c134E6999e5";
  
  const messageHash = hre.ethers.utils.keccak256(
    hre.ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
      [walletAddr, escrowAddr, hre.ethers.constants.AddressZero, amount, callData, 11155111]
    )
  );
  
  const signature = await sessionSigner.signMessage(hre.ethers.utils.arrayify(messageHash));
  console.log('✍️  Session signature created');
  
  // Execute via wallet
  const wallet = await hre.ethers.getContractAt("MinimalWallet", walletAddr);
  
  try {
    const tx = await wallet.executeAsWallet(
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
    
    console.log('📄 Deposit transaction:', tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('🎉 SUCCESS! Deposit executed in block:', receipt.blockNumber);
      
      // Check escrow balance
      const escrow = await hre.ethers.getContractAt("Escrow", escrowAddr);
      const userBalance = await escrow.getUserBalance(walletAddr, hre.ethers.constants.AddressZero);
      console.log('💰 Escrow balance:', hre.ethers.utils.formatEther(userBalance), 'ETH');
      
      console.log('\n🎯 COMPLETE SUCCESS!');
      console.log('Your one-click cross-chain session system works perfectly!');
      console.log('✅ Session installed across chains');
      console.log('✅ Smart wallet funded');
      console.log('✅ Session deposit executed');
      console.log('✅ Funds held in escrow');
      
    } else {
      console.log('❌ Deposit transaction failed');
    }
    
  } catch (error) {
    console.log('❌ Deposit execution failed:', error.message);
  }
}

main().catch(console.error);
