import { useState } from 'react';
import { useCapabilities, useSendCalls, useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { BorderBeam } from "@/components/ui/border-beam";
import { CHAIN_CONFIGS } from '../lib/chainConfigs';
import { 
  groupTransfersByChain, 
  executeMultiChainTransfers,
  findTokenDetails 
} from '../lib/chainUtils';

export default function AtomicTransfer({ transferAmounts = {} }) {
  // Transfer functionality is now integrated into TokenBalance component
  return null;
}