'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { springs, conditionalAnimation, staggerDelay } from '@/lib/animations'
import {
  Home,
  Wallet,
  Coins,
  Lock,
  Users,
  AlertCircle,
  TrendingUp,
  UserCog,
  FileText,
  Plus,
  ClipboardList,
  CheckCircle2,
  BookOpen,
  BarChart3
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserNav } from './user-nav'

interface NavigationItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  roles?: ('admin' | 'collector')[] // Which roles can see this item (undefined = all)
  children?: {
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
    roles?: ('admin' | 'collector')[]
  }[]
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
    roles: ['admin'] // Admin only
  },
  {
    label: 'Chit Funds',
    href: '/chit-funds',
    icon: Wallet,
    roles: ['admin'] // Admin only
  },
  {
    label: 'Collections',
    icon: Coins,
    roles: ['admin', 'collector'], // Both can see Collections
    children: [
      {
        label: 'Record Collection',
        href: '/collect',
        icon: Plus,
        roles: ['admin', 'collector']
      },
      {
        label: 'My Collections',
        href: '/my-collections',
        icon: FileText,
        roles: ['admin', 'collector']
      },
      {
        label: 'Pending Collections',
        href: '/collections/pending',
        icon: ClipboardList,
        roles: ['admin'] // Admin only
      }
    ]
  },
  {
    label: 'Closings',
    icon: Lock,
    roles: ['admin', 'collector'], // Both can see Closings
    children: [
      {
        label: 'Create Closing Session',
        href: '/closings/create',
        icon: Plus,
        roles: ['admin', 'collector']
      },
      {
        label: 'Manage Closings',
        href: '/closings',
        icon: ClipboardList,
        roles: ['admin', 'collector']
      },
      {
        label: 'Approval Queue',
        href: '/approvals',
        icon: CheckCircle2,
        roles: ['admin'] // Admin only
      }
    ]
  },
  {
    label: 'Cashbook',
    icon: BookOpen,
    roles: ['admin'], // Admin only
    children: [
      {
        label: 'Cashbook Ledger',
        href: '/cashbook',
        icon: BookOpen
      },
      {
        label: 'Cash Summary',
        href: '/cashbook/summary',
        icon: BarChart3
      }
    ]
  },
  {
    label: 'Members',
    href: '/members',
    icon: Users,
    roles: ['admin'] // Admin only
  },
  {
    label: 'Arrears',
    href: '/arrears',
    icon: AlertCircle,
    roles: ['admin'] // Admin only
  },
  {
    label: 'Users Management',
    href: '/users',
    icon: UserCog,
    roles: ['admin'] // Admin only
  }
]

// Enhanced animated navigation item components
const AnimatedSidebarMenuItem = ({ 
  children, 
  index = 0 
}: { 
  children: React.ReactNode
  index?: number 
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, index * 50)
    
    return () => clearTimeout(timer)
  }, [index])
  
  const animationStyle = {
    transform: conditionalAnimation(
      isVisible ? 'translateX(0) scale(1)' : 'translateX(-20px) scale(0.95)',
      isVisible ? 'translateX(0) scale(1)' : 'translateX(-10px) scale(0.98)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 200ms ease-out'
    )
  }
  
  return (
    <SidebarMenuItem 
      className="transform-gpu"
      style={animationStyle}
    >
      {children}
    </SidebarMenuItem>
  )
}

const AnimatedSidebarMenuButton = ({ 
  children,
  isActive = false,
  className = '',
  ...props 
}: React.ComponentProps<typeof SidebarMenuButton> & { isActive?: boolean }) => {
  const [isHovered, setIsHovered] = React.useState(false)
  
  const buttonStyle = {
    transform: conditionalAnimation(
      isHovered ? 'scale(1.02)' : 'scale(1)',
      isHovered ? 'scale(1.01)' : 'scale(1)'
    ),
    transition: conditionalAnimation(
      `all ${springs.quick}`,
      'all 150ms ease-out'
    )
  }
  
  return (
    <SidebarMenuButton
      className={`transform-gpu transition-all duration-150 ease-out ${
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
      } ${className}`}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </SidebarMenuButton>
  )
}

const AnimatedSidebarMenuSub = ({ 
  children,
  isOpen = true 
}: { 
  children: React.ReactNode
  isOpen?: boolean 
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])
  
  const submenuStyle = {
    maxHeight: isVisible ? '300px' : '0px',
    opacity: isVisible ? 1 : 0,
    overflow: 'hidden' as const,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 250ms ease-out'
    )
  }
  
  return (
    <SidebarMenuSub 
      className="transform-gpu"
      style={submenuStyle}
    >
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child) ? (
          <div
            key={index}
            style={{
              transform: conditionalAnimation(
                isVisible ? 'translateY(0)' : 'translateY(-10px)',
                isVisible ? 'translateY(0)' : 'translateY(-5px)'
              ),
              opacity: isVisible ? 1 : 0,
              transition: conditionalAnimation(
                `all ${springs.medium}`,
                'all 200ms ease-out'
              ),
              transitionDelay: `${index * 50}ms`
            }}
          >
            {child}
          </div>
        ) : child
      )}
    </SidebarMenuSub>
  )
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    id: string
    email: string
    full_name: string
    role: 'admin' | 'collector'
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const isActiveItem = (href: string) => pathname === href
  const isActiveParent = (children?: NavigationItem['children']) => 
    children?.some(child => pathname === child.href)

  // Filter navigation items based on user role
  const filteredNavigationItems = React.useMemo(() => {
    if (!user) return navigationItems

    return navigationItems
      .filter(item => !item.roles || item.roles.includes(user.role))
      .map(item => {
        // Filter children based on role
        if (item.children) {
          const filteredChildren = item.children.filter(
            child => !child.roles || child.roles.includes(user.role)
          )
          return { ...item, children: filteredChildren }
        }
        return item
      })
      // Remove parent items with no children after filtering
      .filter(item => !item.children || item.children.length > 0)
  }, [user])

  // Auto-expand parent menu if child is active
  React.useEffect(() => {
    filteredNavigationItems.forEach(item => {
      if (item.children && isActiveParent(item.children)) {
        setExpandedItems(prev => new Set([...prev, item.label]))
      }
    })
  }, [pathname, filteredNavigationItems])

  const toggleSubmenu = (itemLabel: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel)
      } else {
        newSet.add(itemLabel)
      }
      return newSet
    })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <AnimatedSidebarMenuItem index={0}>
            <AnimatedSidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Chit Fund</span>
                  <span className="text-xs">Management System</span>
                </div>
              </Link>
            </AnimatedSidebarMenuButton>
          </AnimatedSidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item, index) => {
                const isExpanded = expandedItems.has(item.label)
                const hasActiveChild = isActiveParent(item.children)
                
                if (item.children) {
                  return (
                    <AnimatedSidebarMenuItem key={item.label} index={index + 1}>
                      <AnimatedSidebarMenuButton
                        isActive={hasActiveChild}
                        onClick={() => toggleSubmenu(item.label)}
                        className="cursor-pointer"
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                        <div 
                          className="ml-auto transform transition-transform duration-200"
                          style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                          }}
                        >
                          ▶
                        </div>
                      </AnimatedSidebarMenuButton>
                      <AnimatedSidebarMenuSub isOpen={isExpanded}>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton asChild isActive={isActiveItem(child.href)}>
                              <Link href={child.href}>
                                {child.icon && <child.icon className="size-3" />}
                                <span>{child.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </AnimatedSidebarMenuSub>
                    </AnimatedSidebarMenuItem>
                  )
                }

                return (
                  <AnimatedSidebarMenuItem key={item.label} index={index + 1}>
                    <AnimatedSidebarMenuButton asChild isActive={isActiveItem(item.href!)}>
                      <Link href={item.href!}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                )
              })}
              
              {/* Theme Toggle as a menu item */}
              <AnimatedSidebarMenuItem index={filteredNavigationItems.length + 1}>
                <div className="flex items-center justify-center p-2 mt-4 border-t border-sidebar-border">
                  <ThemeToggle />
                </div>
              </AnimatedSidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <UserNav user={user} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  )
}