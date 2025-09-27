import { useState } from 'react';
import { Header } from '../components/Header';
import AtomicEscrowTransfer from '../components/AtomicEscrowTransfer';

export default function Transfer() {
  const [merchant, setMerchant] = useState(''); // Merchant address for escrow
  const [transferAmounts, setTransferAmounts] = useState({}); // Multi-chain amounts

  return (
    <div>
      <Header />
      <main className="p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Atomic Multi-Chain Escrow Transfer</h1>
          
          {/* Merchant Address Input */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Address (Escrow Recipient):
            </label>
            <input
              type="text"
              placeholder="0xMerchant..."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <AtomicEscrowTransfer 
            merchant={merchant}
            transferAmounts={transferAmounts}
            setTransferAmounts={setTransferAmounts}
          />
        </div>
      </main>
    </div>
  );
}
