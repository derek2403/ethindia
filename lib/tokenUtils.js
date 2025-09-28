import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { formatUnits } from 'viem';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Token balance utilities
export const formatBalance = (balance, decimals) => {
  if (!balance) return '0.00';
  return parseFloat(formatUnits(balance.value, decimals)).toFixed(4);
};

export const createTransferKey = (tokenSymbol, chainId) => {
  return `${tokenSymbol}_${chainId}`;
};

export const parseTransferKey = (key) => {
  const [symbol, chainId] = key.split('_');
  return { symbol, chainId: parseInt(chainId) };
};
