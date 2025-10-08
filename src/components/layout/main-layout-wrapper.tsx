import { getCurrentUser } from '@/lib/auth/utils'
import { MainLayout } from './main-layout'

interface MainLayoutWrapperProps {
  children: React.ReactNode
}

export async function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const user = await getCurrentUser()

  return <MainLayout user={user}>{children}</MainLayout>
}
