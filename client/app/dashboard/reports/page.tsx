// Reports Page
// Generate and download detailed reports
// Accessible by: Admin, Operations, Growth, Merchant roles

'use client'

import { useState, useMemo } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTransactions } from '@/hooks/useTransactions'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { UserRole } from '@/types/analytics'
import {
  formatDate,
  formatCurrency,
  formatCompactNumber,
} from '@/lib/utils/formatting'

type ReportType =
  | 'transaction_summary'
  | 'volume_report'
  | 'user_activity'
  | 'merchant_report'
  | 'network_performance'

interface Report {
  id: ReportType
  name: string
  description: string
  icon: string
  requiredRoles: UserRole[]
}

const availableReports: Report[] = [
  {
    id: 'transaction_summary',
    name: 'Transaction Summary',
    description:
      'Overview of all transactions including volume, counts, and success rates',
    icon: '📊',
    requiredRoles: [
      UserRole.ADMIN,
      UserRole.OPERATIONS,
      UserRole.GROWTH,
      UserRole.MERCHANT,
    ],
  },
  {
    id: 'volume_report',
    name: 'Volume Report',
    description:
      'Detailed breakdown of transaction volume by network, token, and time period',
    icon: '💰',
    requiredRoles: [
      UserRole.ADMIN,
      UserRole.OPERATIONS,
      UserRole.GROWTH,
      UserRole.MERCHANT,
    ],
  },
  {
    id: 'user_activity',
    name: 'User Activity Report',
    description:
      'User engagement metrics, cohort analysis, and retention statistics',
    icon: '👥',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATIONS, UserRole.GROWTH],
  },
  {
    id: 'merchant_report',
    name: 'Merchant Performance',
    description:
      'Merchant-specific metrics including transaction counts and volume',
    icon: '🏪',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATIONS, UserRole.MERCHANT],
  },
  {
    id: 'network_performance',
    name: 'Network Performance',
    description:
      'Gas fees, transaction times, and success rates by blockchain network',
    icon: '⛓️',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATIONS],
  },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(30)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics({
    granularity: 'daily',
    daysBack: dateRange,
  })

  const { data: transactionsData, isLoading: transactionsLoading } =
    useTransactions({ page: 1, limit: 100 })

  const { hasAccess, role } = useRoleAccess([
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.GROWTH,
    UserRole.MERCHANT,
  ])

  // Filter reports based on user role
  const accessibleReports = useMemo(() => {
    return availableReports.filter((report) =>
      report.requiredRoles.includes(role)
    )
  }, [role])

  // Access denied for non-privileged users
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">
            Reports are only available for Admin, Operations, Growth, and
            Merchant roles.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Your current role: <span className="font-medium">{role}</span>
          </p>
        </div>
      </div>
    )
  }

  // Generate report data based on type
  const generateReportData = (reportType: ReportType) => {
    if (!analytics || !transactionsData) return null

    const summary = analytics.summary

    switch (reportType) {
      case 'transaction_summary':
        return {
          title: 'Transaction Summary Report',
          dateRange: `Last ${dateRange} Days`,
          sections: [
            {
              title: 'Overview',
              data: [
                {
                  label: 'Total Transactions',
                  value: formatCompactNumber(summary.totalTransactions),
                },
                { label: 'Total Volume', value: formatCurrency(summary.totalVolumeUSD) },
                { label: 'Success Rate', value: `${summary.successRate.toFixed(2)}%` },
                {
                  label: 'Average Transaction Size',
                  value: formatCurrency(
                    summary.totalVolumeUSD / summary.totalTransactions
                  ),
                },
              ],
            },
            {
              title: 'Transaction Types',
              data: [
                {
                  label: 'Deposits',
                  value: transactionsData.transactions.filter(
                    (tx) => tx.type === 'deposit'
                  ).length,
                },
                {
                  label: 'Withdrawals',
                  value: transactionsData.transactions.filter(
                    (tx) => tx.type === 'withdrawal'
                  ).length,
                },
                {
                  label: 'Conversions',
                  value: transactionsData.transactions.filter(
                    (tx) => tx.type === 'conversion'
                  ).length,
                },
                {
                  label: 'Payments',
                  value: transactionsData.transactions.filter(
                    (tx) => tx.type === 'payment'
                  ).length,
                },
              ],
            },
          ],
        }

      case 'volume_report':
        return {
          title: 'Volume Report',
          dateRange: `Last ${dateRange} Days`,
          sections: [
            {
              title: 'Total Volume',
              data: [
                { label: 'Total USD Value', value: formatCurrency(summary.totalVolumeUSD) },
                {
                  label: 'Daily Average',
                  value: formatCurrency(summary.totalVolumeUSD / dateRange),
                },
              ],
            },
            {
              title: 'By Network',
              data: analytics.networkStats.map((net) => ({
                label: net.network,
                value: formatCurrency(net.totalVolumeUSD),
              })),
            },
            {
              title: 'By Token',
              data: analytics.tokenStats.map((token) => ({
                label: token.symbol,
                value: formatCurrency(token.totalVolumeUSD),
              })),
            },
          ],
        }

      case 'user_activity':
        return {
          title: 'User Activity Report',
          dateRange: `Last ${dateRange} Days`,
          sections: [
            {
              title: 'User Metrics',
              data: [
                {
                  label: 'Active Users',
                  value: formatCompactNumber(summary.activeUsers),
                },
                {
                  label: 'Avg Transactions per User',
                  value: (summary.totalTransactions / summary.activeUsers).toFixed(
                    2
                  ),
                },
                {
                  label: 'Avg Volume per User',
                  value: formatCurrency(
                    summary.totalVolumeUSD / summary.activeUsers
                  ),
                },
              ],
            },
            {
              title: 'Network Distribution',
              data: analytics.networkStats.map((net) => ({
                label: net.network,
                value: `${net.uniqueUsers} users`,
              })),
            },
          ],
        }

      case 'merchant_report':
        const merchantTxs = transactionsData.transactions.filter(
          (tx) => tx.merchantId
        )
        const uniqueMerchants = new Set(merchantTxs.map((tx) => tx.merchantId))
          .size

        return {
          title: 'Merchant Performance Report',
          dateRange: `Last ${dateRange} Days`,
          sections: [
            {
              title: 'Merchant Overview',
              data: [
                { label: 'Active Merchants', value: uniqueMerchants },
                { label: 'Merchant Transactions', value: merchantTxs.length },
                {
                  label: 'Merchant Volume',
                  value: formatCurrency(
                    merchantTxs.reduce(
                      (sum, tx) => sum + (tx.toFiat?.amount || 0),
                      0
                    )
                  ),
                },
                {
                  label: 'Avg per Merchant',
                  value: formatCurrency(
                    merchantTxs.reduce(
                      (sum, tx) => sum + (tx.toFiat?.amount || 0),
                      0
                    ) / (uniqueMerchants || 1)
                  ),
                },
              ],
            },
          ],
        }

      case 'network_performance':
        return {
          title: 'Network Performance Report',
          dateRange: `Last ${dateRange} Days`,
          sections: [
            {
              title: 'Network Statistics',
              data: analytics.networkStats.map((net) => ({
                label: net.network,
                value: `${net.transactionCount} txs, ${formatCurrency(net.totalVolumeUSD)}`,
              })),
            },
            {
              title: 'Gas Fees',
              data: analytics.networkStats.map((net) => ({
                label: net.network,
                value: formatCurrency(net.avgGasFeeUSD),
              })),
            },
          ],
        }

      default:
        return null
    }
  }

  const handleGenerateReport = async (reportType: ReportType) => {
    setSelectedReport(reportType)
    setIsGenerating(true)

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsGenerating(false)
  }

  const handleDownloadReport = (format: 'pdf' | 'csv' | 'excel') => {
    // In production, this would trigger actual download
    alert(
      `Downloading ${selectedReport} as ${format.toUpperCase()}.\n\nThis is a demo - in production, this would generate and download the actual report file.`
    )
  }

  const reportData = selectedReport
    ? generateReportData(selectedReport)
    : null

  if (analyticsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Reports
        </h1>
        <p className="text-gray-400">
          Generate and download detailed analytics reports
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">Report Period:</span>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days as 7 | 30 | 90)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Report Selection Grid */}
      {!selectedReport && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Available Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleReports.map((report) => (
              <button
                key={report.id}
                onClick={() => handleGenerateReport(report.id)}
                className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl p-6 text-left transition-all hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="text-4xl mb-4" aria-hidden="true">
                  {report.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {report.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {report.description}
                </p>
                <span className="text-sm text-blue-400 font-medium">
                  Generate Report →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Loading */}
      {isGenerating && (
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Generating Report...
            </h3>
            <p className="text-gray-400">
              Please wait while we compile your report
            </p>
          </div>
        </div>
      )}

      {/* Report Display */}
      {!isGenerating && reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {reportData.title}
                </h2>
                <p className="text-sm text-gray-400">
                  Generated on {formatDate(new Date())} • {reportData.dateRange}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close report"
              >
                ✕
              </button>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleDownloadReport('pdf')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => handleDownloadReport('csv')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                📊 Download CSV
              </button>
              <button
                onClick={() => handleDownloadReport('excel')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                📈 Download Excel
              </button>
            </div>
          </div>

          {/* Report Sections */}
          {reportData.sections.map((section, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.data.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
                  >
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className="text-sm font-medium text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Report Footer */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400">
              <strong className="text-white">Note:</strong> This report is
              generated from platform data and should be used for informational
              purposes. All values are in USD unless otherwise specified.
            </p>
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
              Report Information
            </h3>
            <p className="text-sm text-gray-300">
              Reports are generated from real-time data and can be exported in
              multiple formats. In this demo, download buttons show an alert.
              In production, they would generate and download actual report
              files (PDF, CSV, Excel).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
