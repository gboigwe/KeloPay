// MetricsCard Component
// Displays KPI metrics with trend indicators

'use client'

import { formatNumber, formatPercentage, formatCurrency, formatCompactNumber } from '@/lib/utils/formatting'

interface MetricsCardProps {
  title: string
  value: string | number
  trend?: number
  icon?: string
  format?: 'number' | 'currency' | 'percentage' | 'compact'
  isLoading?: boolean
  subtitle?: string
}

export default function MetricsCard({
  title,
  value,
  trend,
  icon,
  format = 'number',
  isLoading = false,
  subtitle,
}: MetricsCardProps) {
  // Format value based on format type
  const formattedValue = () => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      case 'compact':
        return formatCompactNumber(value)
      case 'number':
      default:
        return formatNumber(value, 0)
    }
  }

  // Determine trend color and icon
  const getTrendColor = () => {
    if (!trend) return 'text-gray-400'
    return trend > 0 ? 'text-green-500' : 'text-red-500'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    return trend > 0 ? '↑' : '↓'
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
        <div className="h-8 bg-gray-700 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
      role="article"
      aria-label={`${title} metric`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold text-white">{formattedValue()}</h3>
            {icon && (
              <span className="text-2xl" aria-hidden="true">
                {icon}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
              <span className="font-medium" aria-hidden="true">
                {getTrendIcon()}
              </span>
              <span className="ml-1">
                {formatPercentage(Math.abs(trend))}
              </span>
              <span className="ml-1 text-gray-400">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
