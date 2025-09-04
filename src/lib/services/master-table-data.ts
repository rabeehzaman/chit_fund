import { createClient } from '@/lib/supabase/server'

// TypeScript interfaces for master table data
export interface OverviewData {
  totalFunds: number
  activeFunds: number
  totalMembers: number
  activeMembers: number
  totalCollections: number
  pendingCollections: number
  totalClosings: number
  pendingClosings: number
  totalPayouts: number
  completedCycles: number
  totalArrears: number
  totalAdvances: number
}

export interface CollectionData {
  id: string
  date: string
  collector: string
  fund: string
  cycle: number
  member: string
  amount: number
  method: string
  status: string
  closingSession: string | null
  notes: string | null
}

export interface MemberData {
  id: string
  name: string
  phone: string | null
  fundsEnrolled: number
  totalDue: number
  totalPaid: number
  arrears: number
  advances: number
  lastPayment: string | null
  status: string
}

export interface FundData {
  id: string
  name: string
  startDate: string
  duration: number
  members: number
  installment: number
  totalValue: number
  collected: number
  remaining: number
  currentWinner: string | null
  status: string
}

export interface ClosingData {
  id: string
  sessionId: string
  collector: string
  date: string
  declaredTotal: number
  systemTotal: number
  variance: number
  entriesCount: number
  status: string
  approver: string | null
  approvedAt: string | null
}

export interface PayoutData {
  id: string
  fund: string
  cycle: number
  winner: string
  amount: number
  method: string
  date: string
  status: string
  approver: string | null
  receiptNumber: string | null
}

export async function fetchOverviewData(): Promise<OverviewData> {
  const supabase = createClient()

  try {
    const [
      { data: funds, count: totalFunds },
      { data: activeFunds },
      { count: totalMembers },
      { data: activeMembers },
      { count: totalCollections },
      { data: pendingCollections },
      { count: totalClosings },
      { data: pendingClosings },
      { count: totalPayouts },
      { data: completedCycles },
      { data: arrearsData },
      { data: advancesData }
    ] = await Promise.all([
      supabase.from('chit_funds').select('*', { count: 'exact' }),
      supabase.from('chit_funds').select('*').eq('status', 'active'),
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('chit_fund_members').select('member_id').eq('status', 'active'),
      supabase.from('collection_entries').select('*', { count: 'exact', head: true }),
      supabase.from('collection_entries').select('*').eq('status', 'pending_close'),
      supabase.from('closing_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('closing_sessions').select('*').eq('status', 'submitted'),
      supabase.from('payouts').select('*', { count: 'exact', head: true }),
      supabase.from('cycles').select('*').eq('status', 'completed'),
      supabase.from('member_balances').select('arrears_amount').gt('arrears_amount', 0),
      supabase.from('member_balances').select('advance_balance').gt('advance_balance', 0)
    ])

    const totalArrears = arrearsData?.reduce((sum, item) => sum + parseFloat(item.arrears_amount || '0'), 0) || 0
    const totalAdvances = advancesData?.reduce((sum, item) => sum + parseFloat(item.advance_balance || '0'), 0) || 0

    return {
      totalFunds: totalFunds || 0,
      activeFunds: activeFunds?.length || 0,
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers?.length || 0,
      totalCollections: totalCollections || 0,
      pendingCollections: pendingCollections?.length || 0,
      totalClosings: totalClosings || 0,
      pendingClosings: pendingClosings?.length || 0,
      totalPayouts: totalPayouts || 0,
      completedCycles: completedCycles?.length || 0,
      totalArrears,
      totalAdvances
    }
  } catch (error) {
    console.error('Error fetching overview data:', error)
    // Return empty data on error
    return {
      totalFunds: 0,
      activeFunds: 0,
      totalMembers: 0,
      activeMembers: 0,
      totalCollections: 0,
      pendingCollections: 0,
      totalClosings: 0,
      pendingClosings: 0,
      totalPayouts: 0,
      completedCycles: 0,
      totalArrears: 0,
      totalAdvances: 0
    }
  }
}

export async function fetchCollectionsData(): Promise<CollectionData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('collection_entries')
      .select(`
        id,
        amount_collected,
        payment_method,
        collection_date,
        collection_time,
        status,
        notes,
        chit_funds (name),
        cycles (cycle_number, cycle_date),
        members (full_name),
        profiles (full_name),
        closing_sessions (id)
      `)
      .order('collection_date', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching collections data:', error)
      return []
    }

    return (data || []).map((entry: any) => ({
      id: entry.id,
      date: entry.collection_date,
      collector: entry.profiles?.full_name || 'Unknown',
      fund: entry.chit_funds?.name || 'Unknown',
      cycle: entry.cycles?.cycle_number || 0,
      member: entry.members?.full_name || 'Unknown',
      amount: parseFloat(entry.amount_collected || '0'),
      method: entry.payment_method || 'cash',
      status: entry.status === 'closed' ? 'CLOSED' : 'PENDING CLOSE',
      closingSession: entry.closing_sessions?.id ? `CS-${entry.closing_sessions.id.slice(0, 8)}` : null,
      notes: entry.notes
    }))
  } catch (error) {
    console.error('Error fetching collections data:', error)
    return []
  }
}

export async function fetchMembersData(): Promise<MemberData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        full_name,
        phone,
        created_at,
        chit_fund_members (
          status,
          chit_fund_id,
          chit_funds (installment_per_member)
        ),
        collection_entries (
          amount_collected,
          collection_date
        ),
        member_balances (
          arrears_amount,
          advance_balance,
          last_payment_date
        )
      `)
      .order('full_name')

    if (error) {
      console.error('Error fetching members data:', error)
      return []
    }

    return (data || []).map((member: any) => {
      const activeMemberships = member.chit_fund_members?.filter((m: any) => m.status === 'active') || []
      const fundsEnrolled = activeMemberships.length
      
      const totalDue = activeMemberships.reduce((sum: number, membership: any) => {
        return sum + parseFloat(membership.chit_funds?.installment_per_member || '0')
      }, 0)
      
      const totalPaid = member.collection_entries?.reduce((sum: number, entry: any) => {
        return sum + parseFloat(entry.amount_collected || '0')
      }, 0) || 0

      const balances = member.member_balances?.[0] || {}
      const arrears = parseFloat(balances.arrears_amount || '0')
      const advances = parseFloat(balances.advance_balance || '0')

      const lastPaymentDate = member.collection_entries?.[0]?.collection_date || 
                            balances.last_payment_date || null

      return {
        id: member.id,
        name: member.full_name,
        phone: member.phone,
        fundsEnrolled,
        totalDue,
        totalPaid,
        arrears,
        advances,
        lastPayment: lastPaymentDate,
        status: fundsEnrolled > 0 ? 'active' : 'inactive'
      }
    })
  } catch (error) {
    console.error('Error fetching members data:', error)
    return []
  }
}

export async function fetchFundsData(): Promise<FundData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('chit_funds')
      .select(`
        id,
        name,
        start_date,
        duration_months,
        installment_per_member,
        total_amount,
        status,
        chit_fund_members (
          status,
          member_id
        ),
        collection_entries (
          amount_collected
        ),
        cycles (
          cycle_number,
          status,
          winner_member_id,
          members (full_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching funds data:', error)
      return []
    }

    return (data || []).map((fund: any) => {
      const activeMembers = fund.chit_fund_members?.filter((m: any) => m.status === 'active') || []
      const memberCount = activeMembers.length
      
      const totalCollected = fund.collection_entries?.reduce((sum: number, entry: any) => {
        return sum + parseFloat(entry.amount_collected || '0')
      }, 0) || 0

      const installment = parseFloat(fund.installment_per_member || '0')
      const totalValue = installment * memberCount * fund.duration_months
      const remaining = totalValue - totalCollected

      const activeCycle = fund.cycles?.find((c: any) => c.status === 'active')
      const currentWinner = activeCycle?.members?.full_name || null

      return {
        id: fund.id,
        name: fund.name,
        startDate: fund.start_date,
        duration: fund.duration_months,
        members: memberCount,
        installment,
        totalValue,
        collected: totalCollected,
        remaining,
        currentWinner,
        status: fund.status
      }
    })
  } catch (error) {
    console.error('Error fetching funds data:', error)
    return []
  }
}

export async function fetchClosingsData(): Promise<ClosingData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('closing_sessions')
      .select(`
        id,
        session_date,
        declared_total,
        system_total,
        entries_count,
        status,
        submitted_at,
        approved_at,
        profiles!closing_sessions_collector_id_fkey (full_name),
        approver:profiles!closing_sessions_approved_by_fkey (full_name)
      `)
      .order('session_date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching closings data:', error)
      return []
    }

    return (data || []).map((session: any) => {
      const declaredTotal = parseFloat(session.declared_total || '0')
      const systemTotal = parseFloat(session.system_total || '0')
      const variance = declaredTotal - systemTotal

      return {
        id: session.id,
        sessionId: `CS-${session.id.slice(0, 8)}`,
        collector: session.profiles?.full_name || 'Unknown',
        date: session.session_date,
        declaredTotal,
        systemTotal,
        variance,
        entriesCount: session.entries_count || 0,
        status: session.status?.toUpperCase() || 'DRAFT',
        approver: session.approver?.full_name || null,
        approvedAt: session.approved_at
      }
    })
  } catch (error) {
    console.error('Error fetching closings data:', error)
    return []
  }
}

export async function fetchPayoutsData(): Promise<PayoutData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('payouts')
      .select(`
        id,
        payout_amount,
        payout_method,
        payout_date,
        status,
        receipt_number,
        approved_at,
        chit_funds (name),
        cycles (cycle_number),
        members (full_name),
        approver:profiles!payouts_approved_by_fkey (full_name)
      `)
      .order('payout_date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching payouts data:', error)
      return []
    }

    return (data || []).map((payout: any) => ({
      id: payout.id,
      fund: payout.chit_funds?.name || 'Unknown',
      cycle: payout.cycles?.cycle_number || 0,
      winner: payout.members?.full_name || 'Unknown',
      amount: parseFloat(payout.payout_amount || '0'),
      method: payout.payout_method || 'cash',
      date: payout.payout_date,
      status: payout.status?.toUpperCase() || 'PENDING',
      approver: payout.approver?.full_name || null,
      receiptNumber: payout.receipt_number
    }))
  } catch (error) {
    console.error('Error fetching payouts data:', error)
    return []
  }
}

// Hierarchical data interfaces
export interface FundWithStats extends FundData {
  collectionProgress: number // percentage
  arrearsCount: number
  advancesCount: number
  nextCycleDate: string | null
  recentActivity: string | null
}

export interface FundMemberData {
  id: string
  name: string
  phone: string | null
  totalDue: number
  totalPaid: number
  arrears: number
  advances: number
  lastPayment: string | null
  paymentsCount: number
  status: string
  fundId: string
  nextDueAmount: number
}

export interface MemberCollectionData {
  id: string
  date: string
  cycleNumber: number
  amount: number
  method: string
  collector: string
  status: string
  closingSession: string | null
  notes: string | null
  memberId: string
  fundId: string
}

// Hierarchical data fetching functions
export async function fetchFundsWithStats(): Promise<FundWithStats[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('chit_funds')
      .select(`
        id,
        name,
        start_date,
        duration_months,
        installment_per_member,
        total_amount,
        status,
        chit_fund_members (
          status,
          member_id,
          members (full_name)
        ),
        collection_entries (
          amount_collected,
          status
        ),
        member_balances (
          arrears_amount,
          advance_balance
        ),
        cycles (
          cycle_number,
          cycle_date,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching funds with stats:', error)
      return []
    }

    return (data || []).map((fund: any) => {
      const activeMembers = fund.chit_fund_members?.filter((m: any) => m.status === 'active') || []
      const memberCount = activeMembers.length
      
      const totalCollected = fund.collection_entries?.reduce((sum: number, entry: any) => {
        return sum + (entry.status === 'closed' ? parseFloat(entry.amount_collected || '0') : 0)
      }, 0) || 0

      const installment = parseFloat(fund.installment_per_member || '0')
      const totalValue = installment * memberCount * fund.duration_months
      const collectionProgress = totalValue > 0 ? (totalCollected / totalValue * 100) : 0

      const arrearsCount = fund.member_balances?.filter((mb: any) => parseFloat(mb.arrears_amount || '0') > 0).length || 0
      const advancesCount = fund.member_balances?.filter((mb: any) => parseFloat(mb.advance_balance || '0') > 0).length || 0

      const nextCycle = fund.cycles?.find((c: any) => c.status === 'active')
      const recentCollections = fund.collection_entries?.filter((c: any) => c.status === 'closed').slice(-3)

      return {
        id: fund.id,
        name: fund.name,
        startDate: fund.start_date,
        duration: fund.duration_months,
        members: memberCount,
        installment,
        totalValue,
        collected: totalCollected,
        remaining: totalValue - totalCollected,
        currentWinner: null, // Will be populated from cycles if needed
        status: fund.status,
        collectionProgress: Math.round(collectionProgress * 100) / 100,
        arrearsCount,
        advancesCount,
        nextCycleDate: nextCycle?.cycle_date || null,
        recentActivity: recentCollections?.length > 0 ? 'Recent payments received' : 'No recent activity'
      }
    })
  } catch (error) {
    console.error('Error fetching funds with stats:', error)
    return []
  }
}

export async function fetchFundMembers(fundId: string): Promise<FundMemberData[]> {
  const supabase = createClient()

  try {
    // First get the fund members
    const { data: fundMembers, error: membersError } = await supabase
      .from('chit_fund_members')
      .select(`
        member_id,
        status,
        chit_fund_id,
        members (
          id,
          full_name,
          phone
        ),
        chit_funds (
          installment_per_member,
          duration_months
        )
      `)
      .eq('chit_fund_id', fundId)
      .eq('status', 'active')

    if (membersError) {
      console.error('Error fetching fund members:', membersError)
      return []
    }

    if (!fundMembers || fundMembers.length === 0) {
      return []
    }

    // Get member IDs for additional queries
    const memberIds = fundMembers.map(fm => fm.member_id)

    // Get collection entries for these members in this fund
    const { data: collectionEntries } = await supabase
      .from('collection_entries')
      .select('member_id, amount_collected, collection_date, status')
      .eq('chit_fund_id', fundId)
      .in('member_id', memberIds)

    // Get member balances for these members in this fund  
    const { data: memberBalances } = await supabase
      .from('member_balances')
      .select('member_id, arrears_amount, advance_balance, last_payment_date')
      .eq('chit_fund_id', fundId)
      .in('member_id', memberIds)

    // Map the data by combining all sources
    return fundMembers.map((membership: any) => {
      const member = membership.members
      const fund = membership.chit_funds
      
      // Find related data for this member
      const memberCollections = collectionEntries?.filter(ce => ce.member_id === membership.member_id) || []
      const memberBalance = memberBalances?.find(mb => mb.member_id === membership.member_id) || { arrears_amount: '0', advance_balance: '0', last_payment_date: null }
      
      const installment = parseFloat(fund?.installment_per_member || '0')
      const totalDue = installment * (fund?.duration_months || 0)
      
      const totalPaid = memberCollections.reduce((sum: number, entry: any) => {
        return sum + (entry.status === 'closed' ? parseFloat(entry.amount_collected || '0') : 0)
      }, 0)

      const arrears = parseFloat(memberBalance.arrears_amount || '0')
      const advances = parseFloat(memberBalance.advance_balance || '0')
      
      const paymentsCount = memberCollections.filter((c: any) => c.status === 'closed').length
      const lastPaymentEntry = memberCollections
        .filter((c: any) => c.status === 'closed')
        .sort((a: any, b: any) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())[0]
      
      const lastPayment = lastPaymentEntry?.collection_date || memberBalance.last_payment_date || null

      return {
        id: member?.id || membership.member_id,
        name: member?.full_name || 'Unknown',
        phone: member?.phone || null,
        totalDue,
        totalPaid,
        arrears,
        advances,
        lastPayment,
        paymentsCount,
        status: membership.status,
        fundId: fundId,
        nextDueAmount: Math.max(0, installment - advances)
      }
    })
  } catch (error) {
    console.error('Error fetching fund members:', error)
    return []
  }
}

export async function fetchMemberCollections(fundId: string, memberId: string): Promise<MemberCollectionData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('collection_entries')
      .select(`
        id,
        amount_collected,
        payment_method,
        collection_date,
        status,
        notes,
        cycles (
          cycle_number
        ),
        profiles (
          full_name
        ),
        closing_sessions (
          id
        )
      `)
      .eq('chit_fund_id', fundId)
      .eq('member_id', memberId)
      .order('collection_date', { ascending: false })

    if (error) {
      console.error('Error fetching member collections:', error)
      return []
    }

    return (data || []).map((entry: any) => ({
      id: entry.id,
      date: entry.collection_date,
      cycleNumber: entry.cycles?.cycle_number || 0,
      amount: parseFloat(entry.amount_collected || '0'),
      method: entry.payment_method || 'cash',
      collector: entry.profiles?.full_name || 'Unknown',
      status: entry.status === 'closed' ? 'CLOSED' : 'PENDING',
      closingSession: entry.closing_sessions?.id ? `CS-${entry.closing_sessions.id.slice(0, 8)}` : null,
      notes: entry.notes,
      memberId: memberId,
      fundId: fundId
    }))
  } catch (error) {
    console.error('Error fetching member collections:', error)
    return []
  }
}

export async function fetchAllMasterTableData() {
  try {
    const [
      overview,
      collections,
      members,
      funds,
      closings,
      payouts
    ] = await Promise.all([
      fetchOverviewData(),
      fetchCollectionsData(),
      fetchMembersData(),
      fetchFundsData(),
      fetchClosingsData(),
      fetchPayoutsData()
    ])

    return {
      overview,
      collections,
      members,
      funds,
      closings,
      payouts
    }
  } catch (error) {
    console.error('Error fetching all master table data:', error)
    throw error
  }
}

// Main function for hierarchical data
export async function fetchHierarchicalMasterData() {
  try {
    const fundsWithStats = await fetchFundsWithStats()
    
    return {
      funds: fundsWithStats,
      totalFunds: fundsWithStats.length,
      activeFunds: fundsWithStats.filter(f => f.status === 'active').length,
      totalMembers: fundsWithStats.reduce((sum, fund) => sum + fund.members, 0),
      totalCollected: fundsWithStats.reduce((sum, fund) => sum + fund.collected, 0),
      totalValue: fundsWithStats.reduce((sum, fund) => sum + fund.totalValue, 0)
    }
  } catch (error) {
    console.error('Error fetching hierarchical master data:', error)
    throw error
  }
}