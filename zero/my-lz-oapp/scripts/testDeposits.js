const { ethers } = require('hardhat')

// Deployed contract addresses
const CONTRACTS = {
  sepolia: {
    walletFactory: "0x26cEb980e7cDF029f45F3Bf779EFf94A3482c368",
    escrow: "0x22F6da0D9C65715DA3c985a2Bd7A5c134E6999e5"
  },
  hedera: {
    walletFactory: "0xf77109FaD07f756BFf428357033f19f9f4101d92",
    escrow: "0xfc5D46Ab5749937848D50CDf60453e5D24Ae4A43"
  },
  flow: {
    walletFactory: "0x5eF328b24f41680CDDFdf480B764B7C5F843B2CA",
    escrow: "0x2cC13dc7fd2D20200010797A7CEaC041A264E420"
  }
}

// Test token addresses
const TOKENS = {
  sepolia: {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  }
}

// Test amounts
const AMOUNTS = {
  sepolia: {
    ETH: ethers.parseEther("0.03"),     // 0.03 ETH
    USDC: ethers.parseUnits("0.01", 6)  // 0.01 USDC
  },
  hedera: {
    HBAR: ethers.parseEther("0.1")      // 0.1 HBAR
  },
  flow: {
    FLOW: ethers.parseEther("10")       // 10 FLOW
  }
}

// ABIs
const WALLET_FACTORY_ABI = [
  "function getWalletAddress(address owner, bytes32 salt) view returns (address)",
  "function generateSalt(address owner, uint256 chainId) pure returns (bytes32)"
]

const ESCROW_ABI = [
  "function depositNative() payable",
  "function depositERC20(address token, uint256 amount)",
  "function getUserBalance(address user, address token) view returns (uint256)"
]

const MINIMAL_WALLET_ABI = [
  "function executeAsWallet(address target, address token, uint256 amount, bytes calldata data, bytes calldata signature) returns (bool success, bytes memory returnData)"
]

// Network configurations
const NETWORKS = {
  sepolia: { name: 'sepolia', chainId: 11155111 },
  hedera: { name: 'hedera-testnet', chainId: 296 },
  flow: { name: 'flow-testnet', chainId: 545 }
}

class BackendWorker {
  constructor(sessionPrivateKey, userAddress) {
    this.sessionPrivateKey = sessionPrivateKey
    this.userAddress = userAddress
    this.sessionSigner = new ethers.Wallet(sessionPrivateKey)
    
    console.log(`🔑 Backend Worker initialized`)
    console.log(`   Session Address: ${this.sessionSigner.address}`)
    console.log(`   User Address: ${userAddress}`)
  }

  async getWalletAddress(network) {
    const hre = require('hardhat')
    await hre.changeNetwork(network.name)
    
    const walletFactory = await ethers.getContractAt(
      WALLET_FACTORY_ABI,
      CONTRACTS[network.name.replace('-testnet', '')].walletFactory
    )
    
    const salt = await walletFactory.generateSalt(this.userAddress, network.chainId)
    const walletAddress = await walletFactory.getWalletAddress(this.userAddress, salt)
    
    console.log(`📱 ${network.name} wallet: ${walletAddress}`)
    return walletAddress
  }

  async createSessionSignature(walletAddress, target, token, amount, data, chainId) {
    const messageHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint256', 'bytes', 'uint256'],
        [walletAddress, target, token, amount, data, chainId]
      )
    )
    
    const signature = await this.sessionSigner.signMessage(ethers.utils.arrayify(messageHash))
    console.log(`✍️  Session signature created for ${ethers.utils.formatEther(amount)} tokens`)
    return signature
  }

  async executeDeposit(network, tokenAddress, amount, isNative = false) {
    console.log(`\n🚀 Executing ${network.name} deposit...`)
    
    const hre = require('hardhat')
    await hre.changeNetwork(network.name)
    
    // Get wallet address
    const walletAddress = await this.getWalletAddress(network)
    const escrowAddress = CONTRACTS[network.name.replace('-testnet', '')].escrow
    
    // Create deposit call data
    let callData
    if (isNative) {
      const escrowInterface = new ethers.utils.Interface(ESCROW_ABI)
      callData = escrowInterface.encodeFunctionData('depositNative', [])
    } else {
      const escrowInterface = new ethers.utils.Interface(ESCROW_ABI)
      callData = escrowInterface.encodeFunctionData('depositERC20', [tokenAddress, amount])
    }
    
    // Create session signature
    const signature = await this.createSessionSignature(
      walletAddress,
      escrowAddress,
      tokenAddress,
      amount,
      callData,
      network.chainId
    )
    
    // Execute via wallet
    const wallet = await ethers.getContractAt(MINIMAL_WALLET_ABI, walletAddress)
    
    try {
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
      
      console.log(`📄 Transaction sent: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`✅ Confirmed in block ${receipt.blockNumber}`)
      
      return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber }
      
    } catch (error) {
      console.error(`❌ Deposit failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async executeAllTestDeposits() {
    console.log('\n🎯 Starting Test Deposit Execution Sequence...')
    console.log('================================================')
    
    const results = []
    
    try {
      // 1. Sepolia ETH deposit (0.03 ETH)
      console.log('\n1️⃣ Sepolia ETH Deposit')
      const sepoliaETH = await this.executeDeposit(
        NETWORKS.sepolia,
        ethers.constants.AddressZero,
        AMOUNTS.sepolia.ETH,
        true
      )
      results.push({ chain: 'Sepolia', asset: 'ETH', amount: '0.03', ...sepoliaETH })
      
      // 2. Sepolia USDC deposit (0.01 USDC)
      console.log('\n2️⃣ Sepolia USDC Deposit')
      const sepoliaUSDC = await this.executeDeposit(
        NETWORKS.sepolia,
        TOKENS.sepolia.USDC,
        AMOUNTS.sepolia.USDC,
        false
      )
      results.push({ chain: 'Sepolia', asset: 'USDC', amount: '0.01', ...sepoliaUSDC })
      
      // 3. Hedera HBAR deposit (0.1 HBAR)
      console.log('\n3️⃣ Hedera HBAR Deposit')
      const hederaHBAR = await this.executeDeposit(
        NETWORKS.hedera,
        ethers.constants.AddressZero,
        AMOUNTS.hedera.HBAR,
        true
      )
      results.push({ chain: 'Hedera', asset: 'HBAR', amount: '0.1', ...hederaHBAR })
      
      // 4. Flow FLOW deposit (10 FLOW)
      console.log('\n4️⃣ Flow FLOW Deposit')
      const flowFLOW = await this.executeDeposit(
        NETWORKS.flow,
        ethers.constants.AddressZero,
        AMOUNTS.flow.FLOW,
        true
      )
      results.push({ chain: 'Flow', asset: 'FLOW', amount: '10', ...flowFLOW })
      
    } catch (error) {
      console.error(`💥 Critical error in test sequence: ${error.message}`)
      results.push({ error: error.message })
    }
    
    // Print summary
    console.log('\n📊 Test Results Summary')
    console.log('========================')
    results.forEach((result, i) => {
      if (result.success) {
        console.log(`✅ ${result.chain} ${result.asset} (${result.amount}): SUCCESS - Tx: ${result.txHash}`)
      } else {
        console.log(`❌ ${result.chain} ${result.asset} (${result.amount}): FAILED - ${result.error}`)
      }
    })
    
    const successCount = results.filter(r => r.success).length
    console.log(`\n🎯 Overall: ${successCount}/${results.length} deposits successful`)
    
    return results
  }
}

// Export for use
module.exports = { BackendWorker, CONTRACTS, AMOUNTS, NETWORKS }

// If run directly
if (require.main === module) {
  async function main() {
    // Example usage - replace with actual values
    const SESSION_PRIVATE_KEY = process.env.SESSION_PRIVATE_KEY || "0x1234567890123456789012345678901234567890123456789012345678901234"
    const USER_ADDRESS = process.env.USER_ADDRESS || "0xf1a7b4b4B16fc24650D3dC96d5112b5c1F309092"
    
    const worker = new BackendWorker(SESSION_PRIVATE_KEY, USER_ADDRESS)
    await worker.executeAllTestDeposits()
  }
  
  main().catch(console.error)
}
