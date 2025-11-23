'use client'

import Link from 'next/link'
import WalletConnect from './WalletConnect'
import { useAccount } from 'wagmi'

export default function Navbar() {
  const { isConnected } = useAccount()

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent cursor-pointer">
                KeloPay
              </h1>
            </Link>

            {/* Dashboard Link - Only shown when connected */}
            {isConnected && (
              <Link
                href="/dashboard"
                prefetch={true}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <span className="text-lg" aria-hidden="true">📊</span>
                <span>Analytics Dashboard</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isConnected && (
              <span className="text-sm text-gray-400 hidden md:block">
                Bridging Crypto to Real-World Payments
              </span>
            )}
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  )
}

