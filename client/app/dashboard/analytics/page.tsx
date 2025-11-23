// Advanced Analytics Page
// Deep-dive analytics for Users, Conversions, and Merchants
// Accessible by: Admin, Operations, Growth roles only

'use client'

import { useState, useMemo } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { UserRole } from '@/types/analytics'
import MetricsCard from '@/components/dashboard/MetricsCard'
import SimpleLineChart from '@/components/dashboard/Charts/SimpleLineChart'
import SimpleBarChart from '@/components/dashboard/Charts/SimpleBarChart'

type AnalyticsTab = 'users' | 'conversions' | 'merchants'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('users')
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)

  const { data: analytics, isLoading } = useAnalytics({
    granularity: 'daily',
    daysBack: timeRange,
  })

  const { hasAccess, role } = useRoleAccess([
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.GROWTH,
  ])

  // Access denied for non-privileged users
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">
            Advanced Analytics is only available for Admin, Operations, and
            Growth teams.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Your current role: <span className="font-medium">{role}</span>
          </p>
        </div>
      </div>
    )
  }

  // Calculate user analytics
  const userAnalytics = useMemo(() => {
    if (!analytics) return null

    const summary = analytics.summary
    const totalUsers = analytics.metrics.reduce(
      (sum, m) => sum + (m.newUsers || 0),
      0
    )
    const activeUsers = summary.activeUsers
    const avgTransactionsPerUser =
      activeUsers > 0 ? summary.totalTransactions / activeUsers : 0
    const avgVolumePerUser =
      activeUsers > 0 ? summary.totalVolumeUSD / activeUsers : 0

    return {
      totalUsers,
      activeUsers,
      avgTransactionsPerUser,
      avgVolumePerUser,
      userGrowth: summary.userGrowth || 0,
    }
  }, [analytics])

  // Calculate conversion analytics
  const conversionAnalytics = useMemo(() => {
    if (!analytics) return null

    const summary = analytics.summary
    const totalConversions = analytics.transactions.filter(
      (tx) => tx.type === 'conversion'
    ).length
    const avgConversionAmount =
      totalConversions > 0
        ? analytics.transactions
            .filter((tx) => tx.type === 'conversion')
            .reduce((sum, tx) => sum + (tx.toFiat?.amount || 0), 0) /
          totalConversions
        : 0

    return {
      totalConversions,
      conversionRate: summary.successRate,
      avgConversionAmount,
      totalConversionVolume: analytics.transactions
        .filter((tx) => tx.type === 'conversion')
        .reduce((sum, tx) => sum + (tx.toFiat?.amount || 0), 0),
    }
  }, [analytics])

  // Calculate merchant analytics
  const merchantAnalytics = useMemo(() => {
    if (!analytics) return null

    const merchantTxs = analytics.transactions.filter((tx) => tx.merchantId)
    const uniqueMerchants = new Set(
      merchantTxs.map((tx) => tx.merchantId)
    ).size

    const totalMerchantVolume = merchantTxs.reduce(
      (sum, tx) => sum + (tx.toFiat?.amount || 0),
      0
    )
    const avgMerchantVolume =
      uniqueMerchants > 0 ? totalMerchantVolume / uniqueMerchants : 0

    return {
      totalMerchants: uniqueMerchants,
      merchantTransactions: merchantTxs.length,
      totalMerchantVolume,
      avgMerchantVolume,
    }
  }, [analytics])

  // Prepare chart data based on active tab
  const chartData = useMemo(() => {
    if (!analytics) return { line: [], bar: [] }

    if (activeTab === 'users') {
      return {
        line: analytics.metrics.map((m) => ({
          timestamp: new Date(m.periodStart).getTime(),
          date: new Date(m.periodStart).toLocaleDateString(),
          value: m.activeUsers || 0,
        })),
        bar: analytics.networkStats.map((n) => ({
          label: n.network,
          value: n.uniqueUsers || 0,
          color: '#3b82f6',
        })),
      }
    }

    if (activeTab === 'conversions') {
      return {
        line: analytics.metrics.map((m) => ({
          timestamp: new Date(m.periodStart).getTime(),
          date: new Date(m.periodStart).toLocaleDateString(),
          value: Object.values(m.totalVolume).reduce((sum, v) => sum + v.usdValue, 0),
        })),
        bar: analytics.tokenStats.map((t) => ({
          label: t.symbol,
          value: t.totalVolumeUSD,
          color: '#8b5cf6',
        })),
      }
    }

    // merchants
    return {
      line: analytics.metrics.map((m) => ({
        timestamp: new Date(m.periodStart).getTime(),
        date: new Date(m.periodStart).toLocaleDateString(),
        value: m.totalTransactions,
      })),
      bar: analytics.networkStats.map((n) => ({
        label: n.network,
        value: n.totalVolumeUSD,
        color: '#10b981',
      })),
    }
  }, [analytics, activeTab])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Advanced Analytics
        </h1>
        <p className="text-gray-400">
          Deep-dive insights into users, conversions, and merchant activity
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">Time Range:</span>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Analytics tabs">
          {[
            { id: 'users', label: 'User Analytics', icon: '👥' },
            { id: 'conversions', label: 'Conversions', icon: '💱' },
            { id: 'merchants', label: 'Merchants', icon: '🏪' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AnalyticsTab)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* User Analytics Tab */}
      {activeTab === 'users' && userAnalytics && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricsCard
              title="Total Users"
              value={userAnalytics.totalUsers}
              trend={userAnalytics.userGrowth}
              icon="👥"
              format="compact"
            />
            <MetricsCard
              title="Active Users"
              value={userAnalytics.activeUsers}
              icon="✓"
              format="compact"
            />
            <MetricsCard
              title="Avg Transactions/User"
              value={userAnalytics.avgTransactionsPerUser}
              icon="📊"
              format="number"
            />
            <MetricsCard
              title="Avg Volume/User"
              value={userAnalytics.avgVolumePerUser}
              icon="💰"
              format="currency"
            />
          </div>

          {/* Charts */}
          <SimpleLineChart
            data={chartData.line}
            title="Active Users Over Time"
          />

          <SimpleBarChart
            data={chartData.bar}
            title="Users by Network"
          />

          {/* User Cohort Analysis */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              User Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">User Engagement</p>
                <p className="text-2xl font-bold text-white">
                  {userAnalytics.avgTransactionsPerUser.toFixed(2)} tx/user
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average transactions per active user
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  User Value (LTV Proxy)
                </p>
                <p className="text-2xl font-bold text-white">
                  ${userAnalytics.avgVolumePerUser.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Average volume per user
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Analytics Tab */}
      {activeTab === 'conversions' && conversionAnalytics && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricsCard
              title="Total Conversions"
              value={conversionAnalytics.totalConversions}
              icon="💱"
              format="compact"
            />
            <MetricsCard
              title="Conversion Rate"
              value={conversionAnalytics.conversionRate}
              icon="✓"
              format="percentage"
            />
            <MetricsCard
              title="Avg Conversion Amount"
              value={conversionAnalytics.avgConversionAmount}
              icon="💰"
              format="currency"
            />
            <MetricsCard
              title="Total Volume"
              value={conversionAnalytics.totalConversionVolume}
              icon="📊"
              format="currency"
            />
          </div>

          {/* Charts */}
          <SimpleLineChart
            data={chartData.line}
            title="Conversion Volume Over Time"
          />

          <SimpleBarChart
            data={chartData.bar}
            title="Conversion Volume by Token"
          />

          {/* Conversion Funnel */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Conversion Funnel
            </h3>
            <div className="space-y-3">
              {[
                {
                  stage: 'Wallet Connected',
                  value: 100,
                  count: analytics?.summary.activeUsers || 0,
                },
                {
                  stage: 'Initiated Conversion',
                  value: 75,
                  count: Math.floor(
                    (analytics?.summary.activeUsers || 0) * 0.75
                  ),
                },
                {
                  stage: 'Confirmed Transaction',
                  value: 65,
                  count: Math.floor(
                    (analytics?.summary.activeUsers || 0) * 0.65
                  ),
                },
                {
                  stage: 'Completed Conversion',
                  value: conversionAnalytics.conversionRate,
                  count: conversionAnalytics.totalConversions,
                },
              ].map((stage, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      {stage.stage}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {stage.value.toFixed(1)}% ({stage.count})
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stage.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Merchant Analytics Tab */}
      {activeTab === 'merchants' && merchantAnalytics && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricsCard
              title="Total Merchants"
              value={merchantAnalytics.totalMerchants}
              icon="🏪"
              format="compact"
            />
            <MetricsCard
              title="Merchant Transactions"
              value={merchantAnalytics.merchantTransactions}
              icon="💸"
              format="compact"
            />
            <MetricsCard
              title="Total Merchant Volume"
              value={merchantAnalytics.totalMerchantVolume}
              icon="💰"
              format="currency"
            />
            <MetricsCard
              title="Avg Merchant Volume"
              value={merchantAnalytics.avgMerchantVolume}
              icon="📊"
              format="currency"
            />
          </div>

          {/* Charts */}
          <SimpleLineChart
            data={chartData.line}
            title="Merchant Transaction Count Over Time"
          />

          <SimpleBarChart
            data={chartData.bar}
            title="Merchant Volume by Network"
          />

          {/* Merchant Performance */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Merchant Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Avg Transactions per Merchant
                </p>
                <p className="text-2xl font-bold text-white">
                  {merchantAnalytics.totalMerchants > 0
                    ? (
                        merchantAnalytics.merchantTransactions /
                        merchantAnalytics.totalMerchants
                      ).toFixed(1)
                    : '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Transactions per active merchant
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Merchant Adoption Rate
                </p>
                <p className="text-2xl font-bold text-white">
                  {analytics
                    ? (
                        (merchantAnalytics.merchantTransactions /
                          analytics.summary.totalTransactions) *
                        100
                      ).toFixed(1)
                    : '0'}
                  %
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Percentage of transactions via merchants
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="text-2xl" aria-hidden="true">
            ℹ️
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Analytics Information
            </h3>
            <p className="text-sm text-gray-300">
              These analytics are generated from mock data for demonstration
              purposes. In production, data will be sourced from your backend
              API with real transaction history and user activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
