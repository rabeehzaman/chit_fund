'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface NavigationItem {
  label: string
  href?: string
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/'
  },
  {
    label: 'Collections',
    children: [
      { label: 'Record Collection', href: '/collect' },
      { label: 'My Collections', href: '/my-collections' },
      { label: 'Pending Collections', href: '/collections/pending' }
    ]
  },
  {
    label: 'Closings',
    children: [
      { label: 'Create Closing Session', href: '/closings/create' },
      { label: 'Manage Closings', href: '/closings' },
      { label: 'Approval Queue', href: '/approvals' }
    ]
  },
  {
    label: 'Cashbook',
    children: [
      { label: 'Cashbook Ledger', href: '/cashbook' },
      { label: 'Cash Summary', href: '/cashbook/summary' }
    ]
  },
  {
    label: 'Chit Funds',
    href: '/chit-funds'
  },
  {
    label: 'Reports',
    children: [
      { label: 'Financial Reports', href: '/reports/financial' },
      { label: 'Collection Reports', href: '/reports/collections' },
      { label: 'Member Reports', href: '/reports/members' },
      { label: 'Performance Reports', href: '/reports/performance' }
    ]
  },
  {
    label: 'Members',
    href: '/members'
  },
  {
    label: 'Arrears',
    href: '/arrears'
  },
  {
    label: 'Advances',
    href: '/advances'
  },
  {
    label: 'Users Management',
    href: '/users'
  }
]

function NavigationDropdown({ item }: { item: NavigationItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isActiveParent = item.children?.some(child => pathname === child.href)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors
          ${isActiveParent 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }
        `}
      >
        {item.label}
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="py-1">
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href!}
                className={`
                  block px-4 py-2 text-sm transition-colors
                  ${pathname === child.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardNavigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            if (item.children) {
              return <NavigationDropdown key={item.label} item={item} />
            }

            return (
              <Link
                key={item.label}
                href={item.href!}
                className={`
                  border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${pathname === item.href
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}