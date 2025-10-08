import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'collector'
}

/**
 * Get the current authenticated user
 * Redirects to login if not authenticated
 */
export async function getCurrentUser(): Promise<User> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/login')
  }

  return profile as User
}

/**
 * Get the current authenticated user or null if not authenticated
 * Does not redirect
 */
export async function getCurrentUserOrNull(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user profile from profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile as User
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserOrNull()
  return user?.role === 'admin'
}

/**
 * Require admin role - redirects to collection page if not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()

  if (user.role !== 'admin') {
    redirect('/collect')
  }

  return user
}
