// Blockchain Indexer Service
// Monitors blockchain networks and captures transaction events

import { Network, Alchemy } from 'alchemy-sdk'

// Network configuration mapping
const NETWORK_CONFIG: Record<string, { alchemy: Network; chainId: number }> = {
  ethereum: { alchemy: Network.ETH_MAINNET, chainId: 1 },
  sepolia: { alchemy: Network.ETH_SEPOLIA, chainId: 11155111 },
  base: { alchemy: Network.BASE_MAINNET, chainId: 8453 },
  'base-sepolia': { alchemy: Network.BASE_SEPOLIA, chainId: 84532 },
  arbitrum: { alchemy: Network.ARB_MAINNET, chainId: 42161 },
  'arbitrum-sepolia': { alchemy: Network.ARB_SEPOLIA, chainId: 421614 },
}

/**
 * Initialize Alchemy SDK for a specific network
 */
export function getAlchemyInstance(network: string): Alchemy {
  const config = NETWORK_CONFIG[network]

  if (!config) {
    throw new Error(`Unsupported network: ${network}`)
  }

  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY not configured')
  }

  return new Alchemy({
    apiKey,
    network: config.alchemy,
  })
}

/**
 * Get chain ID for a network
 */
export function getChainId(network: string): number {
  const config = NETWORK_CONFIG[network]
  if (!config) {
    throw new Error(`Unsupported network: ${network}`)
  }
  return config.chainId
}

/**
 * Get network name from chain ID
 */
export function getNetworkFromChainId(chainId: number): string {
  for (const [network, config] of Object.entries(NETWORK_CONFIG)) {
    if (config.chainId === chainId) {
      return network
    }
  }
  throw new Error(`Unknown chain ID: ${chainId}`)
}

/**
 * Supported networks list
 */
export const SUPPORTED_NETWORKS = Object.keys(NETWORK_CONFIG)

/**
 * Check if a network is supported
 */
export function isSupportedNetwork(network: string): boolean {
  return SUPPORTED_NETWORKS.includes(network)
}
