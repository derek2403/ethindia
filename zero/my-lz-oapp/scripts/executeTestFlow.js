const hre = require("hardhat");

// Your test parameters
const TEST_CONFIG = {
  userAddress: process.env.USER_ADDRESS || "0xf1a7b4b4B16fc24650D3dC96d5112b5c1F309092", // Default to deployer
  sessionPrivateKey: process.env.SESSION_PRIVATE_KEY || "", // Will be generated during session installation
  
  // Test amounts exactly as requested
  deposits: {
    sepolia: {
      ETH: hre.ethers.parseEther("0.03"),     // 0.03 ETH
      USDC: hre.ethers.parseUnits("0.01", 6)  // 0.01 USDC
    },
    hedera: {
      HBAR: hre.ethers.parseEther("0.1")      // 0.1 HBAR
    },
    flow: {
      FLOW: hre.ethers.parseEther("10")       // 10 FLOW
    }
  }
}

// Contract addresses from deployment
const CONTRACTS = {
  sepolia: {
    escrow: "0x22F6da0D9C65715DA3c985a2Bd7A5c134E6999e5",
    walletFactory: "0x26cEb980e7cDF029f45F3Bf779EFf94A3482c368"
  },
  hedera: {
    escrow: "0xfc5D46Ab5749937848D50CDf60453e5D24Ae4A43",
    walletFactory: "0xf77109FaD07f756BFf428357033f19f9f4101d92"
  },
  flow: {
    escrow: "0x2cC13dc7fd2D20200010797A7CEaC041A264E420",
    walletFactory: "0x5eF328b24f41680CDDFdf480B764B7C5F843B2CA"
  }
}

// Token addresses
const TOKENS = {
  sepolia: {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  }
}

class TestFlowExecutor {
  constructor(userAddress, sessionPrivateKey) {
    this.userAddress = userAddress
    this.sessionPrivateKey = sessionPrivateKey
    this.sessionWallet = new hre.ethers.Wallet(sessionPrivateKey)
    
    console.log(`\n🎯 Test Flow Executor Initialized`)
    console.log(`   User: ${userAddress}`)
    console.log(`   Session Address: ${this.sessionWallet.address}`)
  }

  async getWalletAddress(network) {
    const contracts = CONTRACTS[network]
    const walletFactory = await hre.ethers.getContractAt(
      "WalletFactory", 
      contracts.walletFactory
    )
    
    const chainIds = { sepolia: 11155111, hedera: 296, flow: 545 }
    const salt = await walletFactory.generateSalt(this.userAddress, chainIds[network])
    const walletAddr = await walletFactory.getWalletAddress(this.userAddress, salt)
    
    return walletAddr
  }

  async createSessionSignature(walletAddress, target, token, amount, data, chainId) {
    const messageHash = hre.ethers.keccak256(
      hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
        [walletAddress, target, token, amount, data, chainId]
      )
    )
    
    const signature = await this.sessionWallet.signMessage(hre.ethers.getBytes(messageHash))
    return signature
  }

  async executeDeposit(networkName, tokenAddress, amount, isNative = false) {
    console.log(`\n🚀 Executing ${networkName.toUpperCase()} deposit...`)
    console.log(`   Amount: ${hre.ethers.formatEther(amount)} (${isNative ? 'native' : 'ERC20'})`)
    
    // Switch to target network
    await hre.changeNetwork(networkName === 'hedera' ? 'hedera-testnet' : 
                          networkName === 'flow' ? 'flow-testnet' : 'sepolia')
    
    // Get wallet and escrow addresses
    const walletAddress = await this.getWalletAddress(networkName)
    const escrowAddress = CONTRACTS[networkName].escrow
    
    console.log(`   Wallet: ${walletAddress}`)
    console.log(`   Escrow: ${escrowAddress}`)
    
    // Create deposit call data
    let callData
    if (isNative) {
      const escrowInterface = new hre.ethers.Interface([
        "function depositNative() payable"
      ])
      callData = escrowInterface.encodeFunctionData('depositNative', [])
    } else {
      const escrowInterface = new hre.ethers.Interface([
        "function depositERC20(address token, uint256 amount)"
      ])
      callData = escrowInterface.encodeFunctionData('depositERC20', [tokenAddress, amount])
    }
    
    // Create session signature
    const chainIds = { sepolia: 11155111, hedera: 296, flow: 545 }
    const signature = await this.createSessionSignature(
      walletAddress,
      escrowAddress,
      tokenAddress,
      amount,
      callData,
      chainIds[networkName]
    )
    
    console.log(`   Signature: ${signature.slice(0, 10)}...`)
    
    // Execute via minimal wallet
    try {
      const wallet = await hre.ethers.getContractAt("MinimalWallet", walletAddress)
      
      const tx = await wallet.executeAsWallet(
        escrowAddress,
        tokenAddress,
        amount,
        callData,
        signature,
        {
          value: isNative ? amount : 0,
          gasLimit: 500000
        }
      )
      
      console.log(`   📄 Transaction: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`)
      
      return { success: true, txHash: tx.hash, block: receipt.blockNumber }
      
    } catch (error) {
      console.error(`   ❌ Execution failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async executeAllTestDeposits() {
    console.log('\n🎯 Starting Complete Test Flow')
    console.log('=====================================')
    console.log('Your test: 0.03 ETH + 0.01 USDC (Sepolia), 0.1 HBAR (Hedera), 10 FLOW (Flow)')
    
    const results = []
    
    try {
      // 1. Sepolia ETH (0.03 ETH)
      console.log('\n1️⃣ SEPOLIA ETH DEPOSIT')
      const sepoliaETH = await this.executeDeposit(
        'sepolia',
        hre.ethers.ZeroAddress,
        TEST_CONFIG.deposits.sepolia.ETH,
        true
      )
      results.push({ chain: 'Sepolia', asset: 'ETH', amount: '0.03', ...sepoliaETH })
      
      // 2. Sepolia USDC (0.01 USDC)
      console.log('\n2️⃣ SEPOLIA USDC DEPOSIT')
      const sepoliaUSDC = await this.executeDeposit(
        'sepolia',
        TOKENS.sepolia.USDC,
        TEST_CONFIG.deposits.sepolia.USDC,
        false
      )
      results.push({ chain: 'Sepolia', asset: 'USDC', amount: '0.01', ...sepoliaUSDC })
      
      // 3. Hedera HBAR (0.1 HBAR)
      console.log('\n3️⃣ HEDERA HBAR DEPOSIT')
      const hederaHBAR = await this.executeDeposit(
        'hedera',
        hre.ethers.ZeroAddress,
        TEST_CONFIG.deposits.hedera.HBAR,
        true
      )
      results.push({ chain: 'Hedera', asset: 'HBAR', amount: '0.1', ...hederaHBAR })
      
      // 4. Flow FLOW (10 FLOW)
      console.log('\n4️⃣ FLOW FLOW DEPOSIT')
      const flowFLOW = await this.executeDeposit(
        'flow',
        hre.ethers.ZeroAddress,
        TEST_CONFIG.deposits.flow.FLOW,
        true
      )
      results.push({ chain: 'Flow', asset: 'FLOW', amount: '10', ...flowFLOW })
      
    } catch (error) {
      console.error(`💥 Critical error: ${error.message}`)
      results.push({ error: error.message })
    }
    
    // Print final results
    console.log('\n📊 FINAL TEST RESULTS')
    console.log('======================')
    results.forEach((result, i) => {
      if (result.success) {
        console.log(`✅ ${result.chain} ${result.asset} (${result.amount}): SUCCESS`)
        console.log(`   TX: ${result.txHash}`)
      } else {
        console.log(`❌ ${result.chain} ${result.asset}: FAILED - ${result.error}`)
      }
    })
    
    const successCount = results.filter(r => r.success).length
    console.log(`\n🎯 FINAL SCORE: ${successCount}/${results.length} deposits successful`)
    
    if (successCount === results.length) {
      console.log('🎉 ALL DEPOSITS SUCCESSFUL! Your one-click cross-chain system works perfectly!')
    }
    
    return results
  }
}

async function main() {
  console.log('🔧 To run this test:')
  console.log('1. Complete session installation via frontend (http://localhost:3000/session)')
  console.log('2. Copy the session private key from browser localStorage')
  console.log('3. Set USER_ADDRESS and SESSION_PRIVATE_KEY below')
  console.log('4. Run: npx hardhat run scripts/executeTestFlow.js')
  
  // Get from environment or user input
  const userAddress = process.env.USER_ADDRESS || TEST_CONFIG.userAddress
  const sessionPrivateKey = process.env.SESSION_PRIVATE_KEY || ""
  
  if (!sessionPrivateKey) {
    console.log('\n⚠️  Please set SESSION_PRIVATE_KEY environment variable or update the script')
    console.log('   You can find it in browser localStorage after session installation')
    return
  }
  
  const executor = new TestFlowExecutor(userAddress, sessionPrivateKey)
  await executor.executeAllTestDeposits()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { TestFlowExecutor, TEST_CONFIG, CONTRACTS }
