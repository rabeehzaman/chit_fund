import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchHierarchicalMasterData } from '@/lib/services/master-table-data'

export async function GET() {
  try {
    const data = await fetchHierarchicalMasterData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching hierarchical master data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hierarchical master data' },
      { status: 500 }
    )
  }
}