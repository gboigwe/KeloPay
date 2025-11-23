// Settings Page
// User preferences and account settings

'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { useRoleAccess, getRoleDisplayName, getRoleBadgeColor } from '@/hooks/useRoleAccess'
import { formatAddress } from '@/lib/utils/formatting'

export default function SettingsPage() {
  const { address: appkitAddress } = useAppKitAccount()
  const { address: wagmiAddress, chain } = useAccount()
  const { role } = useRoleAccess()

  const address = wagmiAddress || appkitAddress

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-400">
          Manage your account preferences and dashboard settings
        </p>
      </div>

      {/* Account Information */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Account Information</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Wallet Address
            </label>
            <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
              <span className="font-mono text-white">
                {address ? formatAddress(address, 12, 10) : 'Not connected'}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(address || '')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Connected Network
            </label>
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white">{chain?.name || 'Unknown Network'}</span>
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              User Role
            </label>
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
              <span
                className={`inline-block px-3 py-1 text-sm font-medium text-white rounded ${getRoleBadgeColor(
                  role
                )}`}
              >
                {getRoleDisplayName(role)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Dashboard Preferences</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Theme (Currently Dark Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Theme
            </label>
            <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
              <span className="text-white">Dark Mode (Default)</span>
              <p className="text-xs text-gray-500 mt-1">
                Light mode coming soon
              </p>
            </div>
          </div>

          {/* Default Dashboard View */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Default Dashboard View
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="overview"
            >
              <option value="overview">Overview</option>
              <option value="transactions">Transactions</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>

          {/* Auto-refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Auto-refresh Interval
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="60"
            >
              <option value="30">30 seconds</option>
              <option value="60">1 minute (Default)</option>
              <option value="300">5 minutes</option>
              <option value="0">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Email Notifications</p>
              <p className="text-xs text-gray-400 mt-1">
                Receive email alerts for important events
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700 transition-colors hover:bg-gray-600"
              role="switch"
              aria-checked="false"
            >
              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
            </button>
          </div>

          {/* Transaction Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Transaction Alerts</p>
              <p className="text-xs text-gray-400 mt-1">
                Get notified of new transactions
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors hover:bg-blue-500"
              role="switch"
              aria-checked="true"
            >
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
            </button>
          </div>

          {/* Failed Transaction Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Failed Transaction Alerts</p>
              <p className="text-xs text-gray-400 mt-1">
                Alert when transactions fail
              </p>
            </div>
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors hover:bg-blue-500"
              role="switch"
              aria-checked="true"
            >
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Data & Privacy</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Export Your Data</p>
              <p className="text-xs text-gray-400 mt-1">
                Download all your transaction data
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Export
            </button>
          </div>

          {/* Clear Cache */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Clear Cache</p>
              <p className="text-xs text-gray-400 mt-1">
                Clear locally stored dashboard data
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Settings Information
            </h3>
            <p className="text-sm text-gray-300">
              These settings are currently for demonstration purposes. In production,
              preferences will be saved to your account and synced across devices.
              Your wallet address and role are determined by your connected wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
