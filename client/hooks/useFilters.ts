// useFilters hook - Manages dashboard filter state
// Provides a centralized way to handle filtering across dashboard

'use client'

import { useState, useCallback, useMemo } from 'react'
import { FilterConfig, TransactionType, TransactionStatus } from '@/types/analytics'

// Default filter values
const DEFAULT_FILTERS: FilterConfig = {
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    preset: '30d',
  },
}

/**
 * Hook to manage filter state and operations
 * Provides methods to update and reset filters
 *
 * @param initialFilters - Initial filter configuration
 * @returns Filter state and update methods
 */
export function useFilters(initialFilters: FilterConfig = DEFAULT_FILTERS) {
  const [filters, setFilters] = useState<FilterConfig>(initialFilters)

  // Update date range
  const setDateRange = useCallback((
    startDate: Date,
    endDate: Date,
    preset?: '24h' | '7d' | '30d' | '90d' | '1y' | 'all' | 'custom'
  ) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { startDate, endDate, preset },
    }))
  }, [])

  // Set date range by preset
  const setDatePreset = useCallback((preset: '24h' | '7d' | '30d' | '90d' | '1y' | 'all') => {
    const end = new Date()
    let start: Date

    switch (preset) {
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        start = new Date(0) // Unix epoch
        break
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    setDateRange(start, end, preset)
  }, [setDateRange])

  // Update transaction filters
  const setTransactionFilters = useCallback((updates: {
    types?: TransactionType[]
    statuses?: TransactionStatus[]
    networks?: string[]
    tokens?: string[]
    amountRange?: { min?: number; max?: number; currency?: string }
  }) => {
    setFilters(prev => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        ...updates,
      },
    }))
  }, [])

  // Update user filters
  const setUserFilters = useCallback((updates: {
    roles?: any[]
    regions?: string[]
  }) => {
    setFilters(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...updates,
      },
    }))
  }, [])

  // Update merchant filters
  const setMerchantFilters = useCallback((updates: {
    categories?: string[]
    ids?: string[]
  }) => {
    setFilters(prev => ({
      ...prev,
      merchant: {
        ...prev.merchant,
        ...updates,
      },
    }))
  }, [])

  // Set segmentation
  const setSegmentation = useCallback((
    segmentBy?: 'network' | 'token' | 'userRole' | 'merchantCategory' | 'region',
    groupBy?: 'hour' | 'day' | 'week' | 'month'
  ) => {
    setFilters(prev => ({
      ...prev,
      segmentBy,
      groupBy,
    }))
  }, [])

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Reset specific filter category
  const resetTransactionFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      transaction: undefined,
    }))
  }, [])

  const resetUserFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      user: undefined,
    }))
  }, [])

  const resetMerchantFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      merchant: undefined,
    }))
  }, [])

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.transaction ||
      filters.user ||
      filters.merchant ||
      filters.segmentBy ||
      filters.groupBy
    )
  }, [filters])

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0

    if (filters.transaction?.types?.length) count++
    if (filters.transaction?.statuses?.length) count++
    if (filters.transaction?.networks?.length) count++
    if (filters.transaction?.tokens?.length) count++
    if (filters.transaction?.amountRange) count++
    if (filters.user?.roles?.length) count++
    if (filters.user?.regions?.length) count++
    if (filters.merchant?.categories?.length) count++
    if (filters.merchant?.ids?.length) count++

    return count
  }, [filters])

  return {
    filters,
    setFilters,
    setDateRange,
    setDatePreset,
    setTransactionFilters,
    setUserFilters,
    setMerchantFilters,
    setSegmentation,
    resetFilters,
    resetTransactionFilters,
    resetUserFilters,
    resetMerchantFilters,
    hasActiveFilters,
    activeFilterCount,
  }
}
