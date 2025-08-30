import { redirect } from 'next/navigation'

export default async function Dashboard() {
  // Redirect to chit-funds since dashboard is no longer used
  redirect('/chit-funds')
}