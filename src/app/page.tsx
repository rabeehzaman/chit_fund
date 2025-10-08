import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/utils'

export default async function HomePage() {
  // Redirect based on role - admins to dashboard, collectors to collect
  const user = await getCurrentUser()

  if (user.role === 'admin') {
    redirect('/dashboard')
  } else {
    redirect('/collect')
  }
}
