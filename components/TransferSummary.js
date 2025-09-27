import React from 'react';
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { parseTransferKey } from '../lib/tokenUtils';

const TransferSummary = ({ transferAmounts }) => {
  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <h3 className="font-semibold mb-4 text-blue-800 text-lg">
        🌐 Multi-Chain Transfer Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHAIN_CONFIGS.map(chain => {
          const chainTransfers = Object.entries(transferAmounts).filter(([key, amount]) => {
            const { chainId } = parseTransferKey(key);
            return chainId === chain.chainId && amount > 0;
          });

          return (
            <div key={chain.chainId} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <span>{chain.icon}</span>
                {chain.name}
              </h4>
              {chainTransfers.length > 0 ? (
                <div className="space-y-1">
                  {chainTransfers.map(([key, amount]) => {
                    const { symbol } = parseTransferKey(key);
                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{symbol}:</span>
                        <span className="font-medium">{amount.toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No transfers selected</p>
              )}
            </div>
          );
        })}
      </div>
      
      {Object.values(transferAmounts).every(amount => !amount || amount === 0) && (
        <div className="text-center mt-4">
          <p className="text-blue-600 text-sm">
            No tokens selected for transfer across any chain
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Only tokens you own will be displayed. Use the sliders to select transfer amounts.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransferSummary;
