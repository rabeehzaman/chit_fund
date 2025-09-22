import { MasterTableClient } from './master-table-client'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function MasterTableWrapper() {
  let data = {
    funds: [],
    totalFunds: 0,
    activeFunds: 0,
    totalMembers: 0,
    totalCollected: 0,
    totalValue: 0
  }

  try {
    // Use API route with cache-busting timestamp
    const timestamp = Date.now()

    // Use relative URL for better compatibility across environments
    const url = `/api/hierarchical-master-data?t=${timestamp}`

    console.log('MasterTableWrapper: Fetching fresh data from:', url)

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

    if (response.ok) {
      data = await response.json()
      console.log('MasterTableWrapper: Successfully fetched fresh data:', {
        totalFunds: data.totalFunds,
        totalMembers: data.totalMembers,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('MasterTableWrapper: Failed to fetch hierarchical master data:', response.statusText)
    }
  } catch (error) {
    console.error('MasterTableWrapper: Error fetching hierarchical master data:', error)
  }

  return <MasterTableClient initialData={data} />
}