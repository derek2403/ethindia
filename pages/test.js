import React, { useState } from 'react'
import { Spotlight } from '@/components/ui/spotlight-new'
import SuccessClaimModal from '@/components/SuccessClaimModal'

const TestPage = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [claimDetails, setClaimDetails] = useState({})

  // Function to trigger success modal with mock data
  const showClaimSuccess = (details = {}) => {
    setClaimDetails({
      amount: details.amount || '',
      token: details.token || '',
      tokenIcon: details.tokenIcon || '',
      chain: details.chain || '',
      chainIcon: details.chainIcon || '',
      txHash: details.txHash || '',
      explorerUrl: details.explorerUrl || ''
    })
    setShowSuccessModal(true)
  }

  // Mock data sets for different test scenarios
  const mockTests = [
    {
      name: 'USDC on Polygon',
      data: {
        amount: '100.50',
        token: 'USDC',
        tokenIcon: '/icons/usd-coin-usdc-logo.svg',
        chain: 'polygon',
        chainIcon: '/icons/polygon-matic-logo.svg',
        txHash: '0x1234567890abcdef1234567890abcdef12345678',
        explorerUrl: 'https://polygonscan.com/tx/0x1234567890abcdef1234567890abcdef12345678'
      }
    },
    {
      name: 'ETH on Ethereum',
      data: {
        amount: '0.5',
        token: 'ETH',
        tokenIcon: '/icons/ethereum-eth-logo.svg',
        chain: 'ethereum',
        chainIcon: '/icons/ethereum-eth-logo.svg',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        explorerUrl: 'https://etherscan.io/tx/0xabcdef1234567890abcdef1234567890abcdef12'
      }
    },
    {
      name: 'PYUSD on Arbitrum',
      data: {
        amount: '250.75',
        token: 'PYUSD',
        tokenIcon: '/icons/paypal-usd-pyusd-logo.svg',
        chain: 'arbitrum',
        chainIcon: '/icons/arbitrum-arb-logo.svg',
        txHash: '0x9876543210fedcba9876543210fedcba98765432',
        explorerUrl: 'https://arbiscan.io/tx/0x9876543210fedcba9876543210fedcba98765432'
      }
    },
    {
      name: 'Multi-chain Claim',
      data: {
        amount: 'Multiple',
        token: 'Tokens',
        tokenIcon: '/icons/ethereum-eth-logo.svg',
        chain: 'Multi-chain',
        chainIcon: '/icons/ethereum-eth-logo.svg',
        txHash: '0xfedcba0987654321fedcba0987654321fedcba09',
        explorerUrl: 'https://sepolia.arbiscan.io/tx/0xfedcba0987654321fedcba0987654321fedcba09'
      }
    },
    {
      name: 'General Success Modal (Current Implementation)',
      data: {}
    }
  ]

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* Background Effects */}
      <Spotlight
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, .12) 0, hsla(0, 0%, 100%, .04) 50%, hsla(0, 0%, 100%, 0) 80%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .08) 0, hsla(0, 0%, 100%, .03) 80%, transparent 100%)"
        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, .06) 0, hsla(0, 0%, 100%, .02) 80%, transparent 100%)"
        translateY={-300}
        width={600}
        height={1200}
        smallWidth={300}
        duration={6}
        xOffset={120}
      />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white/90 mb-2">
              Success Modal Test Page
            </h1>
            <p className="text-white/70">
              Test the success claim modal with different mock data scenarios
            </p>
          </div>

          <div className="space-y-4">
            {mockTests.map((test, index) => (
              <button
                key={index}
                onClick={() => showClaimSuccess(test.data)}
                className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl text-white/80 hover:text-white transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white/90 mb-1">
                      {test.name}
                    </div>
                    <div className="text-sm text-white/60">
                      {test.data.amount && test.data.token 
                        ? `${test.data.amount} ${test.data.token} on ${test.data.chain}`
                        : 'Basic success modal without specific details'
                      }
                    </div>
                  </div>
                  <div className="text-white/40 group-hover:text-white/60 transition-colors">
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-white/60 text-sm mb-4">
                Current Modal State: {showSuccessModal ? 'Open' : 'Closed'}
              </p>
              {showSuccessModal && (
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 hover:border-red-400/50 rounded-lg text-red-300 hover:text-red-200 transition-all duration-200 text-sm font-medium"
                >
                  Force Close Modal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessClaimModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        claimDetails={claimDetails}
        onClose={() => setClaimDetails({})}
      />
    </div>
  )
}

export default TestPage
