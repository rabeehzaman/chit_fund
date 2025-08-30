import { MainLayout } from '@/components/layout/main-layout'

interface MainLayoutWrapperProps {
  children: React.ReactNode
}

export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  return <MainLayout>{children}</MainLayout>
}