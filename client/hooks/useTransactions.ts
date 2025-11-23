// useTransactions hook - Fetches transaction history
// Integrates with React Query and Reown AppKit

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppKitAccount } from '@reown/appkit/react'
import { TransactionsResponse, FilterConfig } from '@/types/analytics'
import { mockData } from '@/lib/analytics/mockData'

interface UseTransactionsOptions {
  page?: number
  limit?: number
  filters?: FilterConfig
  enabled?: boolean
}

/**
 * Hook to fetch transaction history with pagination
 * Uses mock data for frontend development until backend API is ready
 *
 * @param options - Transaction query options
 * @returns React Query result with transactions and pagination
 */
export function useTransactions(options: UseTransactionsOptions = {}) {
  const { address, isConnected } = useAppKitAccount()
  const {
    page = 1,
    limit = 20,
    filters,
    enabled = true,
  } = options

  return useQuery({
    queryKey: ['transactions', address, page, limit, filters],
    queryFn: async (): Promise<TransactionsResponse> => {
      // TODO: Replace with actual API call when backend is ready
      // const params = new URLSearchParams({
      //   page: page.toString(),
      //   limit: limit.toString(),
      //   ...(filters && { filters: JSON.stringify(filters) }),
      // })
      // const response = await fetch(`/api/analytics/transactions?${params}`)
      // return response.json()

      // For now, return mock data
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
      return mockData.transactionsPage(page, limit)
    },
    enabled: enabled && isConnected,
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  })
}
