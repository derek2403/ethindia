const hre = require("hardhat");

// Manual test script - bypasses frontend completely
async function main() {
  console.log('🎯 MANUAL TEST MODE');
  console.log('==================');
  console.log('This script simulates the complete flow without frontend');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using deployer as test user:", deployer.address);
  
  // Step 1: Generate session key
  console.log('\n1️⃣ Generating session key...');
  const sessionWallet = hre.ethers.Wallet.createRandom();
  console.log('🔑 Session Private Key:', sessionWallet.privateKey);
  console.log('🔓 Session Public Key:', sessionWallet.address);
  
  // Step 2: Install session via Coordinator (simulate frontend)
  console.log('\n2️⃣ Installing sessions via Coordinator...');
  
  const coordinator = await hre.ethers.getContractAt(
    "Coordinator", 
    "0x0325f7C3BCD3D7039eB247336A00E06aaa395021"
  );
  
  // Get user nonce
  const nonce = await coordinator.getUserNonce(deployer.address);
  console.log('📋 User nonce:', nonce.toString());
  
  // Create session intent
  const expiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const sessionIntent = {
    user: deployer.address,
    sessionPubKey: sessionWallet.address,
    expiry: expiry,
    nonce: Number(nonce),
    destinations: [
      { chainEid: 40285, escrowAddr: "0xfc5D46Ab5749937848D50CDf60453e5D24Ae4A43" }, // Hedera
      { chainEid: 40351, escrowAddr: "0x2cC13dc7fd2D20200010797A7CEaC041A264E420" }  // Flow
    ],
    tokenPolicies: [
      { token: hre.ethers.constants.AddressZero, limit: hre.ethers.utils.parseEther('15') }, // Native tokens
      { token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", limit: hre.ethers.utils.parseUnits('0.02', 6) } // USDC
    ]
  };
  
  // Quote fees
  const options = sessionIntent.destinations.map(() => '0x');
  const fee = await coordinator.quoteInstallSessions(sessionIntent, options, false);
  console.log('💰 Installation fee:', hre.ethers.utils.formatEther(fee.nativeFee), 'ETH');
  
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
  console.log('✍️  EIP-712 signature created');
  
  // Install sessions
  console.log('🚀 Installing sessions...');
  try {
    const tx = await coordinator.installSessions(
      sessionIntent,
      signature,
      options,
      { 
        value: fee.nativeFee,
        gasLimit: 1000000 // Explicit gas limit
      }
    );
    
    console.log('📄 Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Sessions installed in block:', receipt.blockNumber);
    
    // Print LayerZero scan link
    console.log('🔗 LayerZero Scan:', `https://testnet.layerzeroscan.com/tx/${tx.hash}`);
    
  } catch (error) {
    console.log('❌ Installation failed:', error.message);
    
    // Try to decode the error
    if (error.data) {
      console.log('Error data:', error.data);
      
      // Common error signatures
      const errorSigs = {
        '0x21062c5b': 'InvalidNonce()',
        '0xfcc24474': 'SessionExpired()',
        '0x40c10f19': 'EmptyDestinations()',
        '0xce3f4701': 'InvalidSignature()'
      };
      
      const errorSig = error.data.slice(0, 10);
      if (errorSigs[errorSig]) {
        console.log('🔍 Decoded error:', errorSigs[errorSig]);
      }
    }
    
    console.log('\n🛠️  Debugging suggestions:');
    console.log('1. Check session intent structure');
    console.log('2. Verify EIP-712 signature');
    console.log('3. Ensure sufficient ETH balance');
    console.log('4. Check LayerZero peer configuration');
    
    return;
  }
  
  
  // Step 3: Execute test deposits
  console.log('\n3️⃣ Executing test deposits...');
  console.log('Session Private Key for backend:', sessionWallet.privateKey);
  console.log('User Address:', deployer.address);
  
  console.log('\n🎯 Run the following commands to complete the test:');
  console.log('cd /Users/derekliew/Developer/ethindia/zero/my-lz-oapp');
  console.log(`export USER_ADDRESS="${deployer.address}"`);
  console.log(`export SESSION_PRIVATE_KEY="${sessionWallet.privateKey}"`);
  console.log('npx hardhat run scripts/executeTestFlow.js');
  
  console.log('\n📊 Expected result: 4/4 successful deposits across 3 chains!');
}

main().catch(console.error);
