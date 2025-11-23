'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Navbar from "@/components/Navbar";
import { useAccount, useBalance } from 'wagmi'
import { useAppKitAccount, useAppKit } from '@reown/appkit/react'
import { toast } from 'react-toastify'

export default function Home() {
  // AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount()
  const { open } = useAppKit()
  
  // Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected, chain } = useAccount()
  
  const address = wagmiAddress || appkitAddress
  const isConnected = appkitIsConnected || wagmiIsConnected
  
  const { data: balance } = useBalance({
    address: wagmiAddress
  })

  const handleSuccessToast = () => {
    if (isConnected) {
      toast.success(`Connected to ${chain?.name}!`, {
        autoClose: 3000,
      })
    }
  }

  const handleConnect = async () => {
    try {
      await open()
    } catch (error) {
      console.error("Connection error:", error)
    }
  }

  useEffect(() => {
    if (isConnected) {
      handleSuccessToast()
    }
  }, [isConnected])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            {/* Main Heading */}
            <h1 className="text-6xl sm:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
              Bridge Your Crypto
              <br />
              <span className="text-white">To Real Payments</span>
            </h1>
            
            <p className="text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
              Convert crypto to fiat instantly
            </p>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              KeloPay removes friction between digital assets and everyday spending.
              Pay globally without worrying about liquidity or conversions.
            </p>
          </div>

          {/* Call to Action */}
          {!isConnected && (
            <div className="text-center mb-20">
              <button
                onClick={handleConnect}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-blue-500/50 text-lg"
              >
                Connect Wallet to Get Started
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Connect MetaMask, WalletConnect, or 100+ other wallets
              </p>
            </div>
          )}

          {/* Wallet Status Dashboard */}
          {isConnected && (
            <div className="bg-gradient-to-br from-gray-800/90 via-purple-900/30 to-gray-800/90 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-16 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white">
                  Wallet Dashboard
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-400">Connected</span>
                  </div>
                  <Link
                    href="/dashboard"
                    prefetch={true}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
                  >
                    <span className="text-lg" aria-hidden="true">📊</span>
                    <span>View Analytics</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400 mb-2">Wallet Address</p>
                  <p className="text-base font-mono text-white break-all">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                  <p className="text-sm text-gray-400 mb-2">Network</p>
                  <p className="text-xl font-semibold text-white">
                    {chain?.name || 'Unknown'}
                  </p>
                </div>

                {balance && (
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                    <p className="text-sm text-gray-400 mb-2">Balance</p>
                    <p className="text-xl font-bold text-white">
                      {parseFloat(balance.formatted).toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-300">{balance.symbol}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Key Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need for seamless crypto-to-fiat transactions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-900/20 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🔄
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Crypto-to-Fiat Conversion
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Convert Bitcoin, Ethereum, USDT, and more into USD, EUR, NGN, and other fiat currencies in real-time with competitive rates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-900/20 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-3xl">
                💳
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Merchant Payments
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Use your crypto balance to pay for goods and services directly through integrated payment gateways or partner merchants.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-900/20 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🏦
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Instant Settlement
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Funds are instantly converted and settled in merchants' fiat accounts, ensuring smooth transactions and stable pricing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-900/20 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🔐
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Security & Compliance
              </h3>
              <p className="text-gray-400 leading-relaxed">
                End-to-end encryption, KYC verification, and smart contract-based escrow ensure safety and regulatory compliance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-900/20 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🪪
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Wallet Integration
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Connect MetaMask, WalletConnect, Trust Wallet, and 100+ other Web3 wallets to fund your account and make payments.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-900/20 backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 text-3xl">
                💼
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Multi-Currency Support
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Support for multiple crypto and fiat pairs enables global reach and flexible payments across borders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to start paying with crypto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg shadow-blue-500/50">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-gray-400">
                Link your Web3 wallet (MetaMask, WalletConnect, etc.) securely to your KeloPay account
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg shadow-purple-500/50">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Convert Instantly
              </h3>
              <p className="text-gray-400">
                Convert your cryptocurrency to fiat in real-time with competitive exchange rates
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg shadow-pink-500/50">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Pay Merchants
              </h3>
              <p className="text-gray-400">
                Use your converted balance to pay for goods and services worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isConnected && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Bridge Crypto to Real Payments?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Connect your wallet now and experience seamless crypto-to-fiat transactions
              </p>
              <button
                onClick={handleConnect}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-blue-500/50 text-lg"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                KeloPay
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Bridging Crypto to Real-World Payments
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm mb-2">
                Powered by Bandwidth Labs
              </p>
              <p className="text-gray-500 text-xs">
                © 2024 KeloPay. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
