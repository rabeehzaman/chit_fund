import { NextRequest, NextResponse } from 'next/server'
import { fetchMemberCollections } from '@/lib/services/master-table-data'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fundId = searchParams.get('fundId')
    const memberId = searchParams.get('memberId')

    if (!fundId || !memberId) {
      return NextResponse.json(
        { error: 'Fund ID and Member ID are required' },
        { status: 400 }
      )
    }

    const data = await fetchMemberCollections(fundId, memberId)

    const response = NextResponse.json(data)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error fetching member collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member collections' },
      { status: 500 }
    )
  }
}
