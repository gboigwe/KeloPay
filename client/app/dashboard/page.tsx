// Dashboard Overview Page
// Main analytics dashboard with KPIs and charts

'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import MetricsCard from '@/components/dashboard/MetricsCard'
import SimpleLineChart from '@/components/dashboard/Charts/SimpleLineChart'
import SimpleBarChart from '@/components/dashboard/Charts/SimpleBarChart'
import { formatChartDate } from '@/lib/utils/formatting'

export default function DashboardPage() {
  const { data: analytics, isLoading } = useAnalytics({
    granularity: 'daily',
    daysBack: 30,
  })

  const { permissions } = useRoleAccess()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Overview</h1>

        {/* Loading KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <MetricsCard
              key={i}
              title="Loading..."
              value="..."
              isLoading={true}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Unable to load analytics data</p>
      </div>
    )
  }

  const { summary, metrics, networkDistribution } = analytics

  // Prepare chart data
  const volumeChartData = metrics.map((m) => ({
    timestamp: m.periodStart.getTime(),
    date: formatChartDate(m.periodStart, 'daily'),
    value: Object.values(m.totalVolume).reduce((sum, v) => sum + v.usdValue, 0),
  }))

  const transactionChartData = metrics.map((m) => ({
    timestamp: m.periodStart.getTime(),
    date: formatChartDate(m.periodStart, 'daily'),
    value: m.totalTransactions,
  }))

  // Network distribution for bar chart
  const networkChartData = Object.entries(networkDistribution).map(([network, data]) => ({
    label: network.charAt(0).toUpperCase() + network.slice(1),
    value: data.transactions,
    color: getNetworkColor(network),
  }))

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-400">
          Real-time analytics and insights for your platform
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricsCard
          title="Total Transactions"
          value={summary.totalTransactions}
          trend={summary.growthRate}
          icon="💸"
          format="compact"
        />

        <MetricsCard
          title="Total Volume"
          value={summary.totalVolumeUSD}
          trend={summary.volumeGrowth}
          icon="📊"
          format="currency"
        />

        {permissions.viewAllUsers && (
          <MetricsCard
            title="Active Users"
            value={summary.activeUsers}
            trend={summary.userGrowth}
            icon="👥"
            format="compact"
          />
        )}

        <MetricsCard
          title="Success Rate"
          value={summary.successRate}
          icon="✓"
          format="percentage"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Transaction Volume Chart */}
        <SimpleLineChart
          data={volumeChartData}
          title="Transaction Volume (USD)"
          height={300}
          color="#3b82f6"
        />

        {/* Transaction Count Chart */}
        <SimpleLineChart
          data={transactionChartData}
          title="Transaction Count"
          height={300}
          color="#8b5cf6"
        />
      </div>

      {/* Network Distribution */}
      {permissions.viewAnalytics && (
        <SimpleBarChart
          data={networkChartData}
          title="Transactions by Network"
          height={300}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Avg. Confirmation Time</p>
              <p className="text-2xl font-bold text-white">
                {metrics[metrics.length - 1]?.averageConfirmationTime.toFixed(1)}s
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Avg. Gas Fee</p>
              <p className="text-2xl font-bold text-white">
                ${metrics[metrics.length - 1]?.averageGasFee.toFixed(2)}
              </p>
            </div>
            <div className="text-3xl">⛽</div>
          </div>
        </div>

        {permissions.viewMerchantData && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Merchants</p>
                <p className="text-2xl font-bold text-white">
                  {metrics[metrics.length - 1]?.activeMerchants}
                </p>
              </div>
              <div className="text-3xl">🏪</div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-sm text-gray-300">
              This dashboard provides real-time insights into your platform's performance.
              All data is automatically updated every minute. Use the sidebar to explore
              detailed analytics, transaction history, and reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get network colors
function getNetworkColor(network: string): string {
  const colors: Record<string, string> = {
    ethereum: 'bg-blue-500',
    base: 'bg-purple-500',
    arbitrum: 'bg-cyan-500',
    lisk: 'bg-green-500',
    bsc: 'bg-yellow-500',
  }
  return colors[network.toLowerCase()] || 'bg-gray-500'
}
