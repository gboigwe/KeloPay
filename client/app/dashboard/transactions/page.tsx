// Transaction History Page
// Displays all transactions with filtering, sorting, and pagination

'use client'

import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import DataTable, { ColumnDef } from '@/components/dashboard/Tables/DataTable'
import { Transaction, TransactionStatus, TransactionType } from '@/types/analytics'
import {
  formatDate,
  formatAddress,
  formatAmount,
  getBlockExplorerUrl,
  formatStatus,
} from '@/lib/utils/formatting'

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all')

  const { data, isLoading } = useTransactions({ page, limit: 20 })
  const { permissions } = useRoleAccess()

  // Define table columns
  const columns: ColumnDef<Transaction>[] = [
    {
      key: 'timestamp',
      label: 'Date',
      sortable: true,
      render: (tx) => (
        <div>
          <div className="text-white font-medium">
            {formatDate(tx.timestamp)}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(tx.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'txHash',
      label: 'Transaction',
      render: (tx) => (
        <a
          href={getBlockExplorerUrl(tx.network, tx.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-sm"
        >
          {formatAddress(tx.txHash, 10, 8)}
        </a>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (tx) => {
        const colors: Record<string, string> = {
          deposit: 'bg-green-900 text-green-300',
          withdrawal: 'bg-red-900 text-red-300',
          conversion: 'bg-blue-900 text-blue-300',
          payment: 'bg-purple-900 text-purple-300',
          transfer: 'bg-yellow-900 text-yellow-300',
          refund: 'bg-orange-900 text-orange-300',
        }
        return (
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              colors[tx.type] || 'bg-gray-700 text-gray-300'
            }`}
          >
            {formatStatus(tx.type)}
          </span>
        )
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (tx) => (
        <div>
          <div className="text-white font-medium font-mono">
            {formatAmount(tx.fromToken.amount, tx.fromToken.decimals, 4)}{' '}
            {tx.fromToken.symbol}
          </div>
          {tx.toFiat && (
            <div className="text-xs text-gray-400">
              ≈ {tx.toFiat.currency} {tx.toFiat.amount.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (tx) => {
        const colors: Record<string, string> = {
          pending: 'bg-yellow-900 text-yellow-300',
          confirmed: 'bg-blue-900 text-blue-300',
          completed: 'bg-green-900 text-green-300',
          failed: 'bg-red-900 text-red-300',
          cancelled: 'bg-gray-700 text-gray-300',
        }
        return (
          <span
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
              colors[tx.status] || 'bg-gray-700 text-gray-300'
            }`}
          >
            {tx.status === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-1.5" />
            )}
            {formatStatus(tx.status)}
          </span>
        )
      },
    },
    {
      key: 'network',
      label: 'Network',
      sortable: true,
      render: (tx) => (
        <span className="text-gray-300 capitalize">{tx.network}</span>
      ),
    },
  ]

  // Only show additional columns if user has permissions
  if (permissions.viewAllUsers) {
    columns.push({
      key: 'fromAddress',
      label: 'From',
      render: (tx) => (
        <span className="text-gray-400 font-mono text-sm">
          {formatAddress(tx.fromAddress, 6, 4)}
        </span>
      ),
    })
  }

  // Filter transactions
  const filteredData = data?.transactions.filter((tx) => {
    if (selectedType !== 'all' && tx.type !== selectedType) return false
    if (selectedStatus !== 'all' && tx.status !== selectedStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Transaction History
        </h1>
        <p className="text-gray-400">
          View and filter all platform transactions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label
              htmlFor="type-filter"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Transaction Type
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="conversion">Conversion</option>
              <option value="payment">Payment</option>
              <option value="transfer">Transfer</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedType('all')
                setSelectedStatus('all')
                setPage(1)
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-white">
              {data.pagination.total}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">This Page</p>
            <p className="text-2xl font-bold text-white">
              {filteredData?.length || 0}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">
              {filteredData?.filter((tx) => tx.status === 'completed').length || 0}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">
              {filteredData?.filter((tx) => tx.status === 'pending').length || 0}
            </p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <DataTable
        columns={columns}
        data={filteredData || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No transactions found"
      />
    </div>
  )
}
