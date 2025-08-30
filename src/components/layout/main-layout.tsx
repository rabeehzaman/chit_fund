'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PanelLeftOpen } from 'lucide-react'
import { AppSidebar } from './app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'


interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const defaultUser = {
    id: 'system-admin',
    email: 'admin@chitfund.com',
    full_name: 'System Administrator',
    role: 'admin'
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header with sidebar trigger */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">
              Chit Fund Management System
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {defaultUser.full_name}
                </span>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex flex-1 flex-col p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}