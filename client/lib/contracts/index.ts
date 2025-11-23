import KeloPayABI from './KeloPayABI.json';
import KeloPayWithdrawalABI from './KeloPayWithdrawalABI.json';
import KeloPayRouterABI from './KeloPayRouterABI.json';
import KeloPayConversionABI from './KeloPayConversionABI.json';

export { KeloPayABI, KeloPayWithdrawalABI, KeloPayRouterABI, KeloPayConversionABI };

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  // Ethereum Sepolia (chainId: 11155111)
  11155111: {
    KeloPay: '0x...' as `0x${string}`,
    KeloPayWithdrawal: '0x...' as `0x${string}`,
    KeloPayRouter: '0x...' as `0x${string}`,
    KeloPayConversion: '0x...' as `0x${string}`,
  },
  // Base Sepolia (chainId: 84532)
  84532: {
    KeloPay: '0x...' as `0x${string}`,
    KeloPayWithdrawal: '0x...' as `0x${string}`,
    KeloPayRouter: '0x...' as `0x${string}`,
    KeloPayConversion: '0x...' as `0x${string}`,
  },
  // Arbitrum Sepolia (chainId: 421614)
  421614: {
    KeloPay: '0x...' as `0x${string}`,
    KeloPayWithdrawal: '0x...' as `0x${string}`,
    KeloPayRouter: '0x...' as `0x${string}`,
    KeloPayConversion: '0x...' as `0x${string}`,
  },
  // Lisk Sepolia (chainId: 4202)
  4202: {
    KeloPay: '0x...' as `0x${string}`,
    KeloPayWithdrawal: '0x...' as `0x${string}`,
    KeloPayRouter: '0x...' as `0x${string}`,
    KeloPayConversion: '0x...' as `0x${string}`,
  },
  // BSC Testnet (chainId: 97)
  97: {
    KeloPay: '0x...' as `0x${string}`,
    KeloPayWithdrawal: '0x...' as `0x${string}`,
    KeloPayRouter: '0x...' as `0x${string}`,
    KeloPayConversion: '0x...' as `0x${string}`,
  },
} as const;

export type ChainId = keyof typeof CONTRACT_ADDRESSES;
