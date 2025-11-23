// Transaction Processor
// Parses blockchain transaction data and stores in database

import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { getChainId, getNetworkFromChainId } from './indexer'

interface AlchemyWebhookTransaction {
  hash: string
  blockNumber: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  input: string
  nonce: string
}

interface ProcessTransactionInput {
  txHash: string
  blockNumber: number
  timestamp: Date
  network: string
  chainId: number
  fromAddress: string
  toAddress: string
  value: string
  gasUsed: string
  gasPrice: string
  status: 'success' | 'failed'
}

/**
 * Process and store a blockchain transaction
 * This is called when Alchemy webhook receives a transaction event
 */
export async function processTransaction(input: ProcessTransactionInput) {
  try {
    // Check if transaction already exists
    const existingTx = await prisma.transaction.findUnique({
      where: { txHash: input.txHash },
    })

    if (existingTx) {
      console.log(`Transaction ${input.txHash} already processed`)
      return existingTx
    }

    // Determine transaction type based on value and addresses
    const transactionType = determineTransactionType(input)

    // Determine transaction status
    const transactionStatus =
      input.status === 'success' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED

    // Calculate gas fee in wei and USD (placeholder for now)
    const gasFeeWei = (BigInt(input.gasUsed) * BigInt(input.gasPrice)).toString()
    const gasFeeUSD = 0 // TODO: Calculate from gas fee + ETH price

    // Find or create user based on fromAddress
    let user = await prisma.user.findUnique({
      where: { walletAddress: input.fromAddress.toLowerCase() },
    })

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          walletAddress: input.fromAddress.toLowerCase(),
          role: 'USER',
        },
      })
    }

    // Parse token information (simplified - assumes ETH for now)
    const tokenSymbol = 'ETH'
    const tokenAddress = '0x0000000000000000000000000000000000000000'
    const tokenAmount = input.value
    const tokenDecimals = 18

    // Calculate fiat amount (placeholder - will be replaced with real exchange rate)
    const fiatAmount = 0 // TODO: Calculate using exchange rate API
    const exchangeRate = 0

    // Store transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        txHash: input.txHash,
        blockNumber: BigInt(input.blockNumber),
        timestamp: input.timestamp,
        network: input.network,
        chainId: input.chainId,
        type: transactionType,
        status: transactionStatus,
        fromAddress: input.fromAddress.toLowerCase(),
        toAddress: input.toAddress.toLowerCase(),
        fromTokenSymbol: tokenSymbol,
        fromTokenAddress: tokenAddress,
        fromTokenAmount: tokenAmount,
        fromTokenDecimals: tokenDecimals,
        toFiatCurrency: 'USD',
        toFiatAmount: fiatAmount,
        exchangeRate: exchangeRate,
        gasFeeWei: gasFeeWei,
        gasFeeUSD: gasFeeUSD,
        platformFeeUSD: 0,
        metadata: {
          rawValue: input.value,
          gasUsed: input.gasUsed,
          gasPrice: input.gasPrice,
        },
      },
    })

    console.log(`✅ Transaction ${input.txHash} processed successfully`)
    return transaction
  } catch (error) {
    console.error(`❌ Error processing transaction ${input.txHash}:`, error)
    throw error
  }
}

/**
 * Determine transaction type based on transaction data
 * This is a simplified version - can be enhanced with smart contract analysis
 */
function determineTransactionType(input: ProcessTransactionInput): TransactionType {
  // Simple heuristic:
  // - If value > 0 and to a contract: could be deposit
  // - If value > 0 and to user: transfer
  // For now, we'll classify based on value
  const valueInWei = BigInt(input.value)

  if (valueInWei > 0) {
    // Has value transferred
    return TransactionType.TRANSFER
  } else {
    // Contract interaction with no value (could be token swap, etc.)
    return TransactionType.CONVERSION
  }
}

/**
 * Update transaction status (for pending transactions that get confirmed later)
 */
export async function updateTransactionStatus(
  txHash: string,
  status: TransactionStatus,
  errorMessage?: string
) {
  return await prisma.transaction.update({
    where: { txHash },
    data: {
      status,
      errorMessage,
      updatedAt: new Date(),
    },
  })
}

/**
 * Parse Alchemy webhook payload
 */
export function parseAlchemyWebhook(payload: any): ProcessTransactionInput | null {
  try {
    const activity = payload.event?.activity?.[0]
    if (!activity) {
      console.error('No activity found in webhook payload')
      return null
    }

    // Extract transaction details
    const tx = activity

    return {
      txHash: tx.hash,
      blockNumber: parseInt(tx.blockNum, 16), // Convert hex to decimal
      timestamp: new Date(tx.timestamp || Date.now()),
      network: getNetworkFromChainId(parseInt(tx.chainId || '1')),
      chainId: parseInt(tx.chainId || '1'),
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      value: tx.value || '0',
      gasUsed: tx.gasUsed || '0',
      gasPrice: tx.gasPrice || '0',
      status: tx.status === '0x1' ? 'success' : 'failed',
    }
  } catch (error) {
    console.error('Error parsing Alchemy webhook:', error)
    return null
  }
}
