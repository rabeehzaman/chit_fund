'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  CheckCircle2
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
} from '@/components/ui/sidebar'

interface NavigationItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: {
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    label: 'Chit Funds',
    href: '/chit-funds',
    icon: Wallet
  },
  {
    label: 'Collections',
    icon: Coins,
    children: [
      { 
        label: 'Record Collection', 
        href: '/collect',
        icon: Plus
      },
      { 
        label: 'My Collections', 
        href: '/my-collections',
        icon: FileText
      },
      { 
        label: 'Pending Collections', 
        href: '/collections/pending',
        icon: ClipboardList
      }
    ]
  },
  {
    label: 'Closings',
    icon: Lock,
    children: [
      { 
        label: 'Create Closing Session', 
        href: '/closings/create',
        icon: Plus
      },
      { 
        label: 'Manage Closings', 
        href: '/closings',
        icon: ClipboardList
      },
      { 
        label: 'Approval Queue', 
        href: '/approvals',
        icon: CheckCircle2
      }
    ]
  },
  {
    label: 'Members',
    href: '/members',
    icon: Users
  },
  {
    label: 'Arrears',
    href: '/arrears',
    icon: AlertCircle
  },
  {
    label: 'Advances',
    href: '/advances',
    icon: TrendingUp
  },
  {
    label: 'Users Management',
    href: '/users',
    icon: UserCog
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const isActiveItem = (href: string) => pathname === href
  const isActiveParent = (children?: NavigationItem['children']) => 
    children?.some(child => pathname === child.href)

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Chit Fund</span>
                  <span className="text-xs">Management System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                if (item.children) {
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        className={`${isActiveParent(item.children) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
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
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActiveItem(item.href!)}>
                      <Link href={item.href!}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarRail />
    </Sidebar>
  )
}