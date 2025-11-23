// useRoleAccess hook - Role-based access control
// Integrates with Reown AppKit for wallet authentication

'use client'

import { useMemo } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { UserRole } from '@/types/analytics'

// TODO: Replace with actual user data from backend when ready
// For now, we'll determine role based on wallet address
// In production, this should fetch from your user management API

interface RolePermissions {
  viewAllTransactions: boolean
  viewAllUsers: boolean
  viewAnalytics: boolean
  viewMerchantData: boolean
  exportReports: boolean
  configureAlerts: boolean
  manageUsers: boolean
  viewRealtime: boolean
}

/**
 * Hook to manage role-based access control
 * Uses wallet address from Reown AppKit to determine user role
 *
 * @param allowedRoles - Array of roles that have access to the feature
 * @returns Object with access info and permissions
 */
export function useRoleAccess(allowedRoles?: UserRole[]) {
  const { address, isConnected } = useAppKitAccount()

  // TODO: Replace with actual role fetching from backend
  // This is a mock implementation for frontend development
  const role = useMemo((): UserRole => {
    if (!address) return UserRole.USER

    // For demo purposes, assign roles based on address
    // In production, fetch this from your backend API
    const addressLower = address.toLowerCase()

    // Demo: First few characters determine role
    if (addressLower.startsWith('0x00') || addressLower.startsWith('0x11')) {
      return UserRole.ADMIN
    }
    if (addressLower.startsWith('0x22')) {
      return UserRole.OPERATIONS
    }
    if (addressLower.startsWith('0x33')) {
      return UserRole.GROWTH
    }
    if (addressLower.startsWith('0x44')) {
      return UserRole.MERCHANT
    }

    return UserRole.USER
  }, [address])

  // Determine if user has access based on allowed roles
  const hasAccess = useMemo(() => {
    if (!isConnected) return false
    if (!allowedRoles || allowedRoles.length === 0) return true
    return allowedRoles.includes(role)
  }, [isConnected, role, allowedRoles])

  // Define permissions based on role
  const permissions = useMemo((): RolePermissions => {
    const isAdmin = role === UserRole.ADMIN
    const isOperations = role === UserRole.OPERATIONS
    const isGrowth = role === UserRole.GROWTH
    const isMerchant = role === UserRole.MERCHANT

    return {
      viewAllTransactions: isAdmin || isOperations || isGrowth,
      viewAllUsers: isAdmin || isOperations || isGrowth,
      viewAnalytics: isAdmin || isOperations || isGrowth,
      viewMerchantData: isAdmin || isOperations || isMerchant,
      exportReports: isAdmin || isOperations || isGrowth || isMerchant,
      configureAlerts: isAdmin || isOperations,
      manageUsers: isAdmin,
      viewRealtime: isAdmin || isOperations,
    }
  }, [role])

  return {
    hasAccess,
    role,
    permissions,
    isConnected,
    address,
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.OPERATIONS]: 'Operations',
    [UserRole.GROWTH]: 'Growth',
    [UserRole.MERCHANT]: 'Merchant',
    [UserRole.USER]: 'User',
  }
  return names[role]
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-500',
    [UserRole.OPERATIONS]: 'bg-blue-500',
    [UserRole.GROWTH]: 'bg-green-500',
    [UserRole.MERCHANT]: 'bg-yellow-500',
    [UserRole.USER]: 'bg-gray-500',
  }
  return colors[role]
}
