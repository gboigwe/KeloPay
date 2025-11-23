// Mock Data Service for Analytics Dashboard
// Generates realistic data for frontend development

import {
  Transaction,
  TransactionType,
  TransactionStatus,
  UserRole,
  AnalyticsMetrics,
  DashboardData,
  User,
  TransactionsResponse,
  UserAnalytics,
  ConversionAnalytics,
  MerchantAnalytics,
  NetworkStats,
  TokenStats,
} from '@/types/analytics'

// Supported networks from your AppKit config
const NETWORKS = ['ethereum', 'base', 'arbitrum', 'lisk', 'bsc']
const TOKENS = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH']
const FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN']
const MERCHANT_CATEGORIES = ['E-commerce', 'Food & Beverage', 'Entertainment', 'Services', 'Retail']

// Generate random wallet address
function generateWalletAddress(): string {
  return '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

// Generate random transaction hash
function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

// Generate random amount
function generateAmount(min: number = 0.01, max: number = 1000): string {
  return (Math.random() * (max - min) + min).toFixed(6)
}

// Generate mock users
export function generateMockUsers(count: number = 100): User[] {
  const users: User[] = []
  const roles = Object.values(UserRole)

  for (let i = 0; i < count; i++) {
    users.push({
      id: `user-${i}`,
      walletAddress: generateWalletAddress(),
      email: Math.random() > 0.5 ? `user${i}@example.com` : undefined,
      role: roles[Math.floor(Math.random() * roles.length)],
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      metadata: {
        socialProvider: Math.random() > 0.5 ? ['google', 'x', 'github'][Math.floor(Math.random() * 3)] : undefined,
        kycStatus: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as any,
        region: ['US', 'EU', 'ASIA', 'AFRICA'][Math.floor(Math.random() * 4)],
      },
    })
  }

  return users
}

// Generate mock transaction
export function generateMockTransaction(
  userId?: string,
  timestamp?: Date
): Transaction {
  const type = Object.values(TransactionType)[
    Math.floor(Math.random() * Object.values(TransactionType).length)
  ]
  const status = Object.values(TransactionStatus)[
    Math.floor(Math.random() * Object.values(TransactionStatus).length)
  ]
  const network = NETWORKS[Math.floor(Math.random() * NETWORKS.length)]
  const token = TOKENS[Math.floor(Math.random() * TOKENS.length)]
  const amount = generateAmount(0.1, 5000)

  return {
    id: `tx-${Date.now()}-${Math.random()}`,
    userId: userId || `user-${Math.floor(Math.random() * 100)}`,
    txHash: generateTxHash(),
    blockNumber: Math.floor(Math.random() * 10000000) + 18000000,
    timestamp: timestamp || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    type,
    status,
    fromToken: {
      symbol: token,
      address: generateWalletAddress(),
      amount,
      decimals: 18,
    },
    toFiat: Math.random() > 0.5 ? {
      currency: FIAT_CURRENCIES[Math.floor(Math.random() * FIAT_CURRENCIES.length)],
      amount: parseFloat(amount) * (1500 + Math.random() * 500),
      exchangeRate: 1500 + Math.random() * 500,
    } : undefined,
    network,
    chainId: network === 'ethereum' ? 1 : network === 'base' ? 8453 : 42161,
    fromAddress: generateWalletAddress(),
    toAddress: generateWalletAddress(),
    merchantId: Math.random() > 0.7 ? `merchant-${Math.floor(Math.random() * 20)}` : undefined,
    merchantName: Math.random() > 0.7 ? `Merchant ${Math.floor(Math.random() * 20)}` : undefined,
    merchantCategory: Math.random() > 0.7 ? MERCHANT_CATEGORIES[Math.floor(Math.random() * MERCHANT_CATEGORIES.length)] : undefined,
    gasFee: {
      amount: generateAmount(0.001, 0.05),
      token: 'ETH',
    },
    platformFee: Math.random() * 5,
    metadata: {
      userAgent: 'Mozilla/5.0...',
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: {
        country: ['US', 'UK', 'DE', 'NG', 'IN'][Math.floor(Math.random() * 5)],
        city: ['New York', 'London', 'Berlin', 'Lagos', 'Mumbai'][Math.floor(Math.random() * 5)],
      },
    },
  }
}

// Generate multiple mock transactions
export function generateMockTransactions(count: number = 1000): Transaction[] {
  return Array.from({ length: count }, () => generateMockTransaction())
}

// Generate mock analytics metrics
export function generateMockMetrics(
  startDate: Date,
  endDate: Date,
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
): AnalyticsMetrics[] {
  const metrics: AnalyticsMetrics[] = []
  let current = new Date(startDate)

  const incrementMap = {
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  }

  while (current <= endDate) {
    const periodEnd = new Date(current.getTime() + incrementMap[granularity])
    const totalTx = Math.floor(Math.random() * 500) + 100

    metrics.push({
      id: `metrics-${current.getTime()}`,
      periodStart: new Date(current),
      periodEnd,
      granularity,
      totalTransactions: totalTx,
      successfulTransactions: Math.floor(totalTx * 0.92),
      failedTransactions: Math.floor(totalTx * 0.05),
      pendingTransactions: Math.floor(totalTx * 0.03),
      totalVolume: {
        ETH: {
          amount: generateAmount(100, 1000),
          usdValue: Math.random() * 2000000 + 500000,
        },
        USDC: {
          amount: generateAmount(10000, 50000),
          usdValue: Math.random() * 50000 + 10000,
        },
      },
      conversionVolume: {
        USD: Math.random() * 1000000 + 100000,
        EUR: Math.random() * 800000 + 80000,
      },
      activeUsers: Math.floor(Math.random() * 200) + 50,
      newUsers: Math.floor(Math.random() * 50) + 10,
      returningUsers: Math.floor(Math.random() * 150) + 40,
      activeMerchants: Math.floor(Math.random() * 30) + 10,
      merchantPayments: Math.floor(Math.random() * 100) + 20,
      merchantVolume: Math.random() * 500000 + 50000,
      networkDistribution: {
        ethereum: { transactions: Math.floor(totalTx * 0.4), volume: Math.random() * 1000000 },
        base: { transactions: Math.floor(totalTx * 0.25), volume: Math.random() * 500000 },
        arbitrum: { transactions: Math.floor(totalTx * 0.2), volume: Math.random() * 400000 },
        lisk: { transactions: Math.floor(totalTx * 0.1), volume: Math.random() * 200000 },
        bsc: { transactions: Math.floor(totalTx * 0.05), volume: Math.random() * 100000 },
      },
      averageConfirmationTime: Math.random() * 60 + 10,
      successRate: 92 + Math.random() * 6,
      averageGasFee: Math.random() * 5 + 1,
      totalPlatformFees: Math.random() * 10000 + 1000,
      totalGasFees: Math.random() * 50000 + 10000,
      netRevenue: Math.random() * 100000 + 20000,
    })

    current = periodEnd
  }

  return metrics
}

// Generate dashboard data
export function generateMockDashboardData(daysBack: number = 30): DashboardData {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const metrics = generateMockMetrics(startDate, endDate, 'daily')

  const totalTransactions = metrics.reduce((sum, m) => sum + m.totalTransactions, 0)
  const totalVolumeUSD = metrics.reduce((sum, m) => {
    return sum + Object.values(m.totalVolume).reduce((v, t) => v + t.usdValue, 0)
  }, 0)
  const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length

  // Generate network stats
  const networkStats: NetworkStats[] = NETWORKS.map(network => ({
    network,
    transactionCount: Math.floor(totalTransactions * (0.1 + Math.random() * 0.4)),
    totalVolumeUSD: totalVolumeUSD * (0.1 + Math.random() * 0.4),
    uniqueUsers: Math.floor(Math.random() * 200) + 50,
    avgGasFeeUSD: Math.random() * 5 + 0.5,
  }))

  // Generate token stats
  const tokenStats: TokenStats[] = TOKENS.map(token => ({
    symbol: token,
    transactionCount: Math.floor(totalTransactions * (0.1 + Math.random() * 0.3)),
    totalVolumeUSD: totalVolumeUSD * (0.1 + Math.random() * 0.3),
    avgTransactionSize: Math.random() * 5000 + 500,
  }))

  // Generate sample transactions
  const transactions = generateMockTransactions(100)

  return {
    metrics,
    summary: {
      totalTransactions,
      totalVolumeUSD,
      activeUsers: Math.floor(Math.random() * 500) + 100,
      successRate: avgSuccessRate,
      growthRate: Math.random() * 20 + 5,
      volumeGrowth: Math.random() * 30 + 10,
      userGrowth: Math.random() * 15 + 5,
    },
    networkDistribution: metrics[metrics.length - 1].networkDistribution,
    networkStats,
    tokenStats,
    transactions,
  }
}

// Generate paginated transactions
export function generateMockTransactionsPage(
  page: number = 1,
  limit: number = 20,
  total?: number
): TransactionsResponse {
  const totalCount = total || 1000
  const transactions = generateMockTransactions(limit)

  return {
    transactions,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
  }
}

// Generate user analytics
export function generateMockUserAnalytics(): UserAnalytics {
  return {
    total: 1247,
    new: 143,
    active: 892,
    byRole: {
      [UserRole.USER]: 1100,
      [UserRole.MERCHANT]: 120,
      [UserRole.GROWTH]: 15,
      [UserRole.OPERATIONS]: 10,
      [UserRole.ADMIN]: 2,
    },
    retention: {
      day1: 87.5,
      day7: 65.2,
      day30: 42.8,
    },
  }
}

// Generate conversion analytics
export function generateMockConversionAnalytics(): ConversionAnalytics {
  return {
    total: 3456,
    volume: {
      USD: 2567890,
      EUR: 987654,
      GBP: 456789,
      NGN: 123456789,
    },
    averageSize: 742.5,
    byToken: {
      ETH: { count: 1200, volume: 1800000 },
      USDC: { count: 1500, volume: 1500000 },
      USDT: { count: 500, volume: 500000 },
      DAI: { count: 256, volume: 256000 },
    },
  }
}

// Generate merchant analytics
export function generateMockMerchantAnalytics(): MerchantAnalytics {
  return {
    total: 145,
    active: 98,
    topByVolume: [
      { merchantId: 'merchant-1', merchantName: 'TechStore Pro', volume: 456789, transactions: 234 },
      { merchantId: 'merchant-2', merchantName: 'FoodHub Express', volume: 345678, transactions: 567 },
      { merchantId: 'merchant-3', merchantName: 'GameZone', volume: 234567, transactions: 123 },
      { merchantId: 'merchant-4', merchantName: 'Fashion Boutique', volume: 198765, transactions: 345 },
      { merchantId: 'merchant-5', merchantName: 'BookStore Online', volume: 123456, transactions: 89 },
    ],
    byCategory: {
      'E-commerce': { merchants: 45, volume: 1234567 },
      'Food & Beverage': { merchants: 32, volume: 987654 },
      'Entertainment': { merchants: 28, volume: 765432 },
      'Services': { merchants: 25, volume: 543210 },
      'Retail': { merchants: 15, volume: 321098 },
    },
  }
}

// Simulate real-time transaction stream
export function* realtimeTransactionGenerator() {
  while (true) {
    yield generateMockTransaction(undefined, new Date())
  }
}

// Export all mock data functions
export const mockData = {
  users: generateMockUsers,
  transaction: generateMockTransaction,
  transactions: generateMockTransactions,
  metrics: generateMockMetrics,
  dashboard: generateMockDashboardData,
  transactionsPage: generateMockTransactionsPage,
  userAnalytics: generateMockUserAnalytics,
  conversionAnalytics: generateMockConversionAnalytics,
  merchantAnalytics: generateMockMerchantAnalytics,
  realtimeStream: realtimeTransactionGenerator,
}
