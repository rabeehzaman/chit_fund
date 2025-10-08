'use client'

import { AppSidebar } from './app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'


interface MainLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    email: string
    full_name: string
    role: 'admin' | 'collector'
  }
}

function FloatingTrigger() {
  const { state } = useSidebar()
  
  // Only show the floating trigger when sidebar is collapsed or on mobile
  if (state === 'expanded') {
    return null
  }
  
  return (
    <div className="absolute top-4 left-4 z-50">
      <SidebarTrigger className="bg-background border-border shadow-md hover:shadow-lg border" />
    </div>
  )
}

export function MainLayout({ children, user }: MainLayoutProps) {

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <FloatingTrigger />
        {/* Main Content */}
        <main className="flex flex-1 flex-col p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}