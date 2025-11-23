// useAnalytics hook - Fetches dashboard analytics data
// Integrates with React Query for caching and Reown AppKit for wallet info

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppKitAccount } from '@reown/appkit/react'
import { DashboardData, FilterConfig } from '@/types/analytics'
import { mockData } from '@/lib/analytics/mockData'

interface UseAnalyticsOptions {
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  daysBack?: number
  filters?: FilterConfig
  enabled?: boolean
}

/**
 * Hook to fetch analytics dashboard data
 * Uses mock data for frontend development until backend API is ready
 *
 * @param options - Analytics query options
 * @returns React Query result with dashboard data
 */
export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { address, isConnected } = useAppKitAccount()
  const {
    granularity = 'daily',
    daysBack = 30,
    filters,
    enabled = true,
  } = options

  return useQuery({
    queryKey: ['analytics', 'dashboard', address, granularity, daysBack, filters],
    queryFn: async (): Promise<DashboardData> => {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/analytics/overview', {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ granularity, daysBack, filters }),
      // })
      // return response.json()

      // For now, return mock data
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      return mockData.dashboard(daysBack)
    },
    enabled: enabled && isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute for updated data
  })
}
