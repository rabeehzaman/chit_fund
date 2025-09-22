import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchHierarchicalMasterData } from '@/lib/services/master-table-data'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await fetchHierarchicalMasterData()

    // Create response with aggressive cache-busting headers
    const response = NextResponse.json(data)

    // Prevent all forms of caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    // Add timestamp to help detect cache issues
    response.headers.set('X-Fetch-Time', new Date().toISOString())

    return response
  } catch (error) {
    console.error('Error fetching hierarchical master data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hierarchical master data' },
      { status: 500 }
    )
  }
}