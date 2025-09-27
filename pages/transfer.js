import { useState } from 'react';
import { Header } from '../components/Header';
import AtomicTransfer from '../components/AtomicTransfer';
import TokenBalance from '../components/TokenBalance';

export default function Transfer() {
  const [transferAmounts, setTransferAmounts] = useState({});

  return (
    <div>
      <Header />
      <main className="p-4">
        <TokenBalance 
          transferAmounts={transferAmounts}
          setTransferAmounts={setTransferAmounts}
        />
        <AtomicTransfer 
          transferAmounts={transferAmounts}
        />
      </main>
    </div>
  );
}
