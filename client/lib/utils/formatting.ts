// Formatting utilities for analytics dashboard
// Handles numbers, dates, addresses, and other display formatting

/**
 * Format wallet address to shortened version
 * @param address - Full wallet address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address like "0x1234...5678"
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Format number with comma separators
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number like "1,234.56"
 */
export function formatNumber(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return '0'

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format currency amount
 * @param value - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency like "$1,234.56"
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'USD',
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format crypto amount with proper decimals
 * @param amount - Amount as string (from BigNumber)
 * @param decimals - Token decimals (default: 18)
 * @param displayDecimals - Decimals to show (default: 4)
 * @returns Formatted amount
 */
export function formatAmount(
  amount: string,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    const value = parseFloat(amount) / Math.pow(10, decimals)
    return formatNumber(value, displayDecimals)
  } catch {
    return '0'
  }
}

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param value - Number to format
 * @returns Formatted number like "1.2K" or "3.4M"
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toFixed(0)
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @param includeTime - Whether to include time (default: false)
 * @returns Formatted date like "Jan 15, 2025" or "Jan 15, 2025 3:45 PM"
 */
export function formatDate(
  date: Date | string,
  includeTime: boolean = false
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return 'Invalid date'

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }

  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return new Intl.DateTimeFormat('en-US', options).format(d)
}

/**
 * Format date for display in charts
 * @param date - Date to format
 * @param granularity - Time granularity
 * @returns Formatted date appropriate for the granularity
 */
export function formatChartDate(
  date: Date | string,
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return ''

  switch (granularity) {
    case 'hourly':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      }).format(d)
    case 'daily':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(d)
    case 'weekly':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(d)
    case 'monthly':
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric',
      }).format(d)
    default:
      return formatDate(d)
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(d)
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage like "12.5%"
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format duration in seconds
 * @param seconds - Duration in seconds
 * @returns Formatted duration like "2m 30s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

/**
 * Get blockchain explorer URL for transaction
 * @param network - Network name
 * @param txHash - Transaction hash
 * @returns Explorer URL
 */
export function getBlockExplorerUrl(
  network: string,
  txHash: string
): string {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    base: 'https://basescan.org/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    lisk: 'https://blockscout.lisk.com/tx/',
    bsc: 'https://bscscan.com/tx/',
    sepolia: 'https://sepolia.etherscan.io/tx/',
    'base-sepolia': 'https://sepolia.basescan.org/tx/',
  }

  const baseUrl = explorers[network.toLowerCase()] || explorers.ethereum
  return `${baseUrl}${txHash}`
}

/**
 * Get network display name
 * @param network - Network identifier
 * @returns Readable network name
 */
export function getNetworkName(network: string): string {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    arbitrum: 'Arbitrum',
    lisk: 'Lisk',
    bsc: 'BSC',
    sepolia: 'Sepolia',
    'base-sepolia': 'Base Sepolia',
  }

  return names[network.toLowerCase()] || network
}

/**
 * Format file size
 * @param bytes - File size in bytes
 * @returns Formatted size like "1.2 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format transaction status for display
 * @param status - Transaction status
 * @returns Formatted status
 */
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
