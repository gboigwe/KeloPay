// Sidebar Navigation Component
// Responsive sidebar with role-based navigation items

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRoleAccess, getRoleDisplayName, getRoleBadgeColor } from '@/hooks/useRoleAccess'
import { UserRole } from '@/types/analytics'

interface NavItem {
  name: string
  href: string
  icon: string
  requiredRoles?: UserRole[]
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: '📊' },
  { name: 'Transactions', href: '/dashboard/transactions', icon: '💸' },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: '📈',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATIONS, UserRole.GROWTH],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: '📄',
    requiredRoles: [UserRole.ADMIN, UserRole.OPERATIONS, UserRole.GROWTH, UserRole.MERCHANT],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: '⚙️',
  },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { role, permissions, address } = useRoleAccess()

  // Filter navigation items based on user role
  const visibleNavItems = navigation.filter(item => {
    if (!item.requiredRoles) return true
    return item.requiredRoles.includes(role)
  })

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 border-r border-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Dashboard navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
            <Link
              href="/dashboard"
              className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
            >
              KeloPay
            </Link>
            {/* Close button for mobile */}
            <button
              onClick={onMobileClose}
              className="lg:hidden text-gray-400 hover:text-white"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {address?.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium text-white rounded ${getRoleBadgeColor(
                    role
                  )}`}
                >
                  {getRoleDisplayName(role)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="list">
            {visibleNavItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  onClick={() => onMobileClose?.()}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                    transition-colors duration-150
                    ${
                      active
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="mr-3 text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800">
            <div className="text-xs text-gray-500">
              <p>© 2025 KeloPay</p>
              <p className="mt-1">Analytics Dashboard v1.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
