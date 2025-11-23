// Analytics Overview API
// Returns dashboard summary data

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { z } from 'zod'

// Query parameters schema
const querySchema = z.object({
  daysBack: z.coerce.number().min(1).max(365).default(30),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
})

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const params = querySchema.parse({
      daysBack: searchParams.get('daysBack') || '30',
      granularity: searchParams.get('granularity') || 'daily',
    })

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - params.daysBack * 24 * 60 * 60 * 1000)

    // Fetch transactions in date range
    const transactions = await prisma.transaction.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    // Calculate summary metrics
    const totalTransactions = transactions.length
    const completedTransactions = transactions.filter(tx => tx.status === 'COMPLETED')
    const successRate = totalTransactions > 0
      ? (completedTransactions.length / totalTransactions) * 100
      : 0

    const totalVolumeUSD = transactions.reduce((sum, tx) => {
      return sum + (tx.toFiatAmount ? Number(tx.toFiatAmount) : 0)
    }, 0)

    // Get unique active users
    const activeUsers = new Set(transactions.map(tx => tx.userId)).size

    // Group by network
    const networkStats = transactions.reduce((acc, tx) => {
      if (!acc[tx.network]) {
        acc[tx.network] = {
          network: tx.network,
          transactionCount: 0,
          totalVolumeUSD: 0,
          uniqueUsers: new Set(),
          avgGasFeeUSD: [],
        }
      }
      acc[tx.network].transactionCount++
      acc[tx.network].totalVolumeUSD += tx.toFiatAmount ? Number(tx.toFiatAmount) : 0
      acc[tx.network].uniqueUsers.add(tx.userId)
      acc[tx.network].avgGasFeeUSD.push(Number(tx.gasFeeUSD))
      return acc
    }, {} as Record<string, any>)

    const networkStatsArray = Object.values(networkStats).map((stat: any) => ({
      network: stat.network,
      transactionCount: stat.transactionCount,
      totalVolumeUSD: stat.totalVolumeUSD,
      uniqueUsers: stat.uniqueUsers.size,
      avgGasFeeUSD: stat.avgGasFeeUSD.reduce((a: number, b: number) => a + b, 0) / stat.avgGasFeeUSD.length,
    }))

    // Group by token
    const tokenStats = transactions.reduce((acc, tx) => {
      const symbol = tx.fromTokenSymbol
      if (!acc[symbol]) {
        acc[symbol] = {
          symbol,
          transactionCount: 0,
          totalVolumeUSD: 0,
          totalAmount: 0,
        }
      }
      acc[symbol].transactionCount++
      acc[symbol].totalVolumeUSD += tx.toFiatAmount ? Number(tx.toFiatAmount) : 0
      return acc
    }, {} as Record<string, any>)

    const tokenStatsArray = Object.values(tokenStats).map((stat: any) => ({
      symbol: stat.symbol,
      transactionCount: stat.transactionCount,
      totalVolumeUSD: stat.totalVolumeUSD,
      avgTransactionSize: stat.transactionCount > 0 ? stat.totalVolumeUSD / stat.transactionCount : 0,
    }))

    // Build metrics array (simplified - group by day for now)
    const metricsMap = new Map()
    transactions.forEach(tx => {
      const dayKey = tx.timestamp.toISOString().split('T')[0]
      if (!metricsMap.has(dayKey)) {
        metricsMap.set(dayKey, {
          periodStart: new Date(dayKey),
          periodEnd: new Date(dayKey),
          totalTransactions: 0,
          activeUsers: new Set(),
          totalVolume: {},
          successRate: { successful: 0, total: 0 },
          networkDistribution: {},
        })
      }
      const metric = metricsMap.get(dayKey)
      metric.totalTransactions++
      metric.activeUsers.add(tx.userId)
      metric.successRate.total++
      if (tx.status === 'COMPLETED') metric.successRate.successful++
    })

    const metrics = Array.from(metricsMap.values()).map(m => ({
      ...m,
      activeUsers: m.activeUsers.size,
      successRate: m.successRate.total > 0 ? (m.successRate.successful / m.successRate.total) * 100 : 0,
    }))

    // Response
    return successResponse({
      summary: {
        totalTransactions,
        totalVolumeUSD,
        activeUsers,
        successRate,
        growthRate: 0, // TODO: Calculate from previous period
        volumeGrowth: 0,
        userGrowth: 0,
      },
      metrics,
      networkStats: networkStatsArray,
      tokenStats: tokenStatsArray,
      transactions: transactions.slice(0, 100), // Latest 100 transactions
      networkDistribution: {}, // TODO: Implement if needed
    })

  } catch (error) {
    return handleApiError(error)
  }
}
