import { MasterTableClient } from './master-table-client'
import { fetchHierarchicalMasterData, FundWithStats } from '@/lib/services/master-table-data'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function MasterTableWrapper() {
  let data: {
    funds: FundWithStats[]
    totalFunds: number
    activeFunds: number
    totalMembers: number
    totalCollected: number
    totalValue: number
  } = {
    funds: [],
    totalFunds: 0,
    activeFunds: 0,
    totalMembers: 0,
    totalCollected: 0,
    totalValue: 0
  }

  try {
    // Direct database call - faster and more reliable than API route
    // Real-time updates are now handled by Supabase Realtime on client side
    console.log('MasterTableWrapper: Fetching data directly from database...')

    data = await fetchHierarchicalMasterData()

    console.log('MasterTableWrapper: Successfully fetched data:', {
      totalFunds: data.totalFunds,
      totalMembers: data.totalMembers,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('MasterTableWrapper: Error fetching hierarchical master data:', error)
  }

  return <MasterTableClient initialData={data} />
}