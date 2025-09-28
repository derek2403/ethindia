import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BarChart3, X, Download } from 'lucide-react'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'

// Hardcoded configurations for withdraw - same as escrow.js
const ESCROW_CHAIN_CONFIGS = [
  {
    chainId: 11155111,
    name: 'Sepolia',
    escrowAddress: '0x724D4Ec728b54B1b2E963811981504EEc56E85FF',
  },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia', 
    escrowAddress: '0xFBdB5D6A0bf37A3b0D87EC317661a83581890692',
  }
];

// Token Icon with Chain overlay - optimized for QR modal
const TokenWithChain = ({ tokenSrc, chainSrc, tokenAlt, chainAlt }) => (
  <div className="relative w-8 h-8">
    <Image 
      src={tokenSrc} 
      alt={tokenAlt} 
      width={32} 
      height={32} 
      className="w-8 h-8 rounded-full"
    />
    {chainSrc && (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-black/80 rounded-full p-0.5 border border-white/20 shadow-lg">
        <Image 
          src={chainSrc} 
          alt={chainAlt} 
          width={12} 
          height={12} 
          className="w-3 h-3 rounded-full"
        />
      </div>
    )}
  </div>
)

const QRDisplay = ({ 
  showQRModal,
  setShowQRModal,
  qrDataUrl, 
  selectedChains, 
  chains, 
  tokensByChain,
  totalAllocation, 
  address, 
  resetSelection,
  showClaimSuccess 
}) => {
  const { isConnected } = useAccount()
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // All chains withdrawal handler - same as escrow.js
  const handleWithdrawAll = async () => {
    try {
      setIsWithdrawing(true)
      
      if (!isConnected || !address) {
        alert('Please connect your wallet first')
        return
      }

      // Step 1: Withdraw from Sepolia - normal user signature
      console.log("Step 1: Withdrawing from Sepolia...");
      
      const sepoliaConfig = ESCROW_CHAIN_CONFIGS.find(c => c.chainId === 11155111);
      if (!sepoliaConfig) {
        throw new Error("Sepolia config not found");
      }

      // Create provider and contract for Sepolia withdrawal
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const sepoliaContract = new ethers.Contract(
        sepoliaConfig.escrowAddress,
        [
          {
            "inputs": [],
            "name": "withdraw", 
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        signer
      );

      // Execute withdrawal on Sepolia (user signs)
      const sepoliaTx = await sepoliaContract.withdraw();
      console.log("Sepolia withdrawal tx:", sepoliaTx.hash);
      await sepoliaTx.wait();
      
      // Step 2: Withdraw from Arbitrum using private key
      console.log("Step 2: Withdrawing from Arbitrum Sepolia using private key...");
      
      const arbitrumConfig = ESCROW_CHAIN_CONFIGS.find(c => c.chainId === 421614);
      if (!arbitrumConfig) {
        throw new Error("Arbitrum config not found");
      }

      // Get environment variables (must use NEXT_PUBLIC_ for client-side access)
      const privateKey = process.env.PRIVATE_KEY || process.env.NEXT_PUBLIC_PRIVATE_KEY;
      const arbitrumRpc = process.env.RPC_ARB || process.env.NEXT_PUBLIC_RPC_ARB;

      if (!privateKey || !arbitrumRpc) {
        throw new Error("Missing environment variables: NEXT_PUBLIC_PRIVATE_KEY or NEXT_PUBLIC_RPC_ARB");
      }

      // Create Arbitrum provider and signer
      const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumRpc);
      const arbitrumSigner = new ethers.Wallet(privateKey, arbitrumProvider);
      
      // Create contract instance for Arbitrum
      const arbitrumContract = new ethers.Contract(
        arbitrumConfig.escrowAddress,
        [
          {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        arbitrumSigner
      );

      // Execute withdrawal on Arbitrum
      const arbitrumTx = await arbitrumContract.withdraw();
      console.log("Arbitrum withdrawal tx:", arbitrumTx.hash);
      
      await arbitrumTx.wait();
      console.log("✅ Withdrawal completed on both chains!");
      
      // Success - close modal and show success modal
      setShowQRModal(false);
      
      // Show general success modal
      if (showClaimSuccess) {
        showClaimSuccess({});
      }
      
      // Reset after a delay to let user see success modal
      setTimeout(() => {
        resetSelection();
      }, 1000);
      
    } catch (error) {
      console.error("All chains withdrawal failed:", error);
      alert(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!showQRModal) return null


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
      <motion.div 
        className="glass-card max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center space-y-6">
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6 }}
        >
          <h3 className="text-xl font-bold text-white/90">Payment Claim Summary</h3>
          <p className="text-lg text-white/80 font-medium">Review your preferences and claim funds from both chains</p>
          
        </motion.div>
      
        {qrDataUrl && (
          <motion.div 
            className="flex flex-col items-center space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
          
            {/* Portfolio Summary */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-w-2xl w-full">
              <div className="mb-3"></div>
              <div className="mb-3">
                <div className="bg-white/5 border border-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {Object.entries(selectedChains).map(([chain, tokens]) => {
                      const chainInfo = chains.find(c => c.id === chain)
                      
                      return Object.entries(tokens).map(([token, allocation], index) => {
                        const tokenInfo = tokensByChain[chain]?.find(t => t.name === token)
                        return (
                          <motion.div 
                            key={`${chain}-${token}`} 
                            className="relative flex flex-col items-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + index * 0.02, duration: 0.15 }}
                            whileHover={{ y: -2 }}
                          >
                            <TokenWithChain 
                              tokenSrc={tokenInfo?.icon || '/icons/ethereum-eth-logo.svg'}
                              chainSrc={chainInfo?.icon || '/icons/ethereum-eth-logo.svg'}
                              tokenAlt={`${token} ${allocation}%`}
                              chainAlt={chainInfo?.name || chain}
                            />
                            <motion.div 
                              className="mt-1 bg-white/20 rounded-full px-2 py-1 border border-white/30 backdrop-blur-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.08 + index * 0.02, duration: 0.15 }}
                            >
                              <span className="text-white text-xs font-medium">{allocation}%</span>
                            </motion.div>
                          </motion.div>
                        )
                      })
                    }).flat()}
                  </div>
                </div>
              </div>
            </div>
          
          
            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.2 }}
            >
              <motion.button
                onClick={() => setShowQRModal(false)}
                className="px-6 py-2.5 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/40 text-sm flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </motion.button>
              <motion.button
                onClick={handleWithdrawAll}
                disabled={isWithdrawing || !isConnected}
                className={`px-6 py-2.5 border text-white rounded-lg transition-all duration-200 font-medium backdrop-blur-sm text-sm flex items-center justify-center space-x-2 ${
                  isWithdrawing || !isConnected
                    ? 'bg-gray-500/20 border-gray-500/30 cursor-not-allowed'
                    : 'bg-green-600/20 border-green-500/30 hover:bg-green-500/30 hover:border-green-400/40'
                }`}
                whileHover={!isWithdrawing && isConnected ? { scale: 1.02 } : {}}
                whileTap={!isWithdrawing && isConnected ? { scale: 0.98 } : {}}
              >
                {isWithdrawing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Confirm Claim</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
        </div>
      </motion.div>
    </div>
  )
}

export default QRDisplay
