// Dashboard Header Component
// Top bar with wallet info and mobile menu toggle

'use client'

import Link from 'next/link'
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'
import { formatAddress } from '@/lib/utils/formatting'

interface HeaderProps {
  onMenuToggle?: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { open } = useAppKit()
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-white p-2 -ml-2"
          aria-label="Open sidebar menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Page title & Back button - visible on desktop */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title="Back to Home"
          >
            <span aria-hidden="true">←</span>
            <span>Home</span>
          </Link>
          <div className="h-6 w-px bg-gray-700" />
          <h1 className="text-lg font-semibold text-white">Analytics Dashboard</h1>
        </div>

        {/* Mobile back button */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          title="Back to Home"
        >
          <span aria-hidden="true">←</span>
          <span>Home</span>
        </Link>

        {/* Right side - Wallet info */}
        <div className="flex items-center space-x-4">
          {isConnected && chain && (
            <>
              {/* Network indicator */}
              <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                <span className="text-sm text-gray-300">{chain.name}</span>
              </div>

              {/* Wallet address */}
              <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-800 rounded-lg">
                <span className="text-sm font-mono text-gray-300">
                  {formatAddress(address || '', 6, 4)}
                </span>
              </div>

              {/* Disconnect button */}
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            </>
          )}

          {!isConnected && (
            <button
              onClick={() => open()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              aria-label="Connect wallet"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
