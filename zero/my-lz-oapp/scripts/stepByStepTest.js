const hre = require("hardhat");

async function main() {
  console.log('🔬 STEP-BY-STEP DIAGNOSIS');
  console.log('=========================');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("User:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  // Step 1: Test basic Coordinator functions
  console.log('\n1️⃣ Testing basic Coordinator functions...');
  const coordinator = await hre.ethers.getContractAt(
    "Coordinator", 
    "0x0325f7C3BCD3D7039eB247336A00E06aaa395021"
  );
  
  const nonce = await coordinator.getUserNonce(deployer.address);
  console.log('✅ User nonce:', nonce.toString());
  
  const domainSeparator = await coordinator.DOMAIN_SEPARATOR();
  console.log('✅ Domain separator:', domainSeparator);
  
  const walletFactory = await coordinator.walletFactory();
  console.log('✅ Wallet factory:', walletFactory);
  
  // Step 2: Test WalletFactory
  console.log('\n2️⃣ Testing WalletFactory...');
  const factory = await hre.ethers.getContractAt("WalletFactory", walletFactory);
  
  const salt = await factory.generateSalt(deployer.address, 11155111);
  console.log('✅ Generated salt:', salt);
  
  const walletAddr = await factory.getWalletAddress(deployer.address, salt);
  console.log('✅ Predicted wallet:', walletAddr);
  
  // Step 3: Test session installation with minimal data
  console.log('\n3️⃣ Testing minimal session installation...');
  
  // Create minimal session intent (just Hedera)
  const sessionWallet = hre.ethers.Wallet.createRandom();
  const sessionIntent = {
    user: deployer.address,
    sessionPubKey: sessionWallet.address,
    expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    nonce: Number(nonce),
    destinations: [
      { chainEid: 40285, escrowAddr: "0xfc5D46Ab5749937848D50CDf60453e5D24Ae4A43" } // Only Hedera
    ],
    tokenPolicies: [
      { token: hre.ethers.constants.AddressZero, limit: hre.ethers.utils.parseEther('1') } // 1 ETH limit
    ]
  };
  
  console.log('📋 Session intent created');
  console.log('   Destinations:', sessionIntent.destinations.length);
  console.log('   Token policies:', sessionIntent.tokenPolicies.length);
  
  // Quote fees for minimal intent
  const options = ['0x']; // One option for one destination
  
  try {
    const fee = await coordinator.quoteInstallSessions(sessionIntent, options, false);
    console.log('✅ Fee quote successful:', hre.ethers.utils.formatEther(fee.nativeFee), 'ETH');
    
    // Try the actual installation
    console.log('\n4️⃣ Attempting installation...');
    
    // Create EIP-712 signature
    const domain = {
      name: 'SessionCoordinator',
      version: '1',
      chainId: 11155111,
      verifyingContract: "0x0325f7C3BCD3D7039eB247336A00E06aaa395021"
    };
    
    const types = {
      SessionIntent: [
        { name: 'user', type: 'address' },
        { name: 'sessionPubKey', type: 'address' },
        { name: 'expiry', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'destinations', type: 'Destination[]' },
        { name: 'tokenPolicies', type: 'TokenPolicy[]' }
      ],
      Destination: [
        { name: 'chainEid', type: 'uint32' },
        { name: 'escrowAddr', type: 'address' }
      ],
      TokenPolicy: [
        { name: 'token', type: 'address' },
        { name: 'limit', type: 'uint256' }
      ]
    };
    
    const signature = await deployer._signTypedData(domain, types, sessionIntent);
    console.log('✅ EIP-712 signature created');
    
    // Call with dry run first
    try {
      await coordinator.callStatic.installSessions(sessionIntent, signature, options, { value: fee.nativeFee });
      console.log('✅ Dry run successful');
    } catch (staticError) {
      console.log('❌ Dry run failed:', staticError.message);
      
      // Try to identify the specific revert reason
      if (staticError.reason) {
        console.log('🔍 Revert reason:', staticError.reason);
      }
      
      return;
    }
    
    // If dry run passes, execute real transaction
    const tx = await coordinator.installSessions(
      sessionIntent,
      signature,
      options,
      { 
        value: fee.nativeFee,
        gasLimit: 2000000
      }
    );
    
    console.log('✅ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('🎉 SUCCESS! Sessions installed in block:', receipt.blockNumber);
      console.log('🔗 LayerZero Scan:', `https://testnet.layerzeroscan.com/tx/${tx.hash}`);
      
      console.log('\n🎯 Ready for deposit testing!');
      console.log('Session Private Key:', sessionWallet.privateKey);
      console.log('User Address:', deployer.address);
    } else {
      console.log('❌ Transaction failed');
    }
    
  } catch (error) {
    console.log('❌ Quote or installation failed:', error.message);
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }
}

main().catch(console.error);
