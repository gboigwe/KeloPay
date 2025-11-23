import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { KeloPayABI, CONTRACT_ADDRESSES, type ChainId } from '@/lib/contracts';

export function useKeloPayContract() {
  const { chainId } = useAppKitAccount();
  const contractAddress = chainId ? CONTRACT_ADDRESSES[chainId as ChainId]?.KeloPay : undefined;

  // Write functions
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Deposit ETH
  const depositETH = async (amount: bigint) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');

    return writeContract({
      address: contractAddress,
      abi: KeloPayABI,
      functionName: 'depositETH',
      value: amount,
    });
  };

  // Create Escrow
  const createEscrow = async (
    token: `0x${string}`,
    amount: bigint,
    releaseTime: bigint,
    conversionRequestId: `0x${string}`,
    value?: bigint
  ) => {
    if (!contractAddress) throw new Error('Contract not deployed on this network');

    return writeContract({
      address: contractAddress,
      abi: KeloPayABI,
      functionName: 'createEscrow',
      args: [token, amount, releaseTime, conversionRequestId],
      value,
    });
  };

  // Read functions
  const { data: platformFee } = useReadContract({
    address: contractAddress,
    abi: KeloPayABI,
    functionName: 'platformFeeBasisPoints',
  });

  const { data: treasury } = useReadContract({
    address: contractAddress,
    abi: KeloPayABI,
    functionName: 'treasury',
  });

  // Get user deposits
  const useUserDeposits = (userAddress?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: KeloPayABI,
      functionName: 'getUserDeposits',
      args: userAddress ? [userAddress] : undefined,
    });
  };

  // Get user escrows
  const useUserEscrows = (userAddress?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: KeloPayABI,
      functionName: 'getUserEscrows',
      args: userAddress ? [userAddress] : undefined,
    });
  };

  return {
    // Write functions
    depositETH,
    createEscrow,

    // Transaction state
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,

    // Read data
    platformFee,
    treasury,
    useUserDeposits,
    useUserEscrows,

    // Contract info
    contractAddress,
  };
}
