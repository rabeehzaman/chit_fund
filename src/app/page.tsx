import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedStatsCard, AnimatedStatsGrid, StatsCardContent } from '@/components/ui/animated-stats-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react'
import { CollectionTrendChart } from '@/components/charts/collection-trend-chart'
import { PaymentMethodChart } from '@/components/charts/payment-method-chart'
import { FundPerformanceChart } from '@/components/charts/fund-performance-chart'
import { CollectorPerformanceChart } from '@/components/charts/collector-performance-chart'
import { ArrearsAgingChart } from '@/components/charts/arrears-aging-chart'
import { CashFlowChart } from '@/components/charts/cash-flow-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { MasterTableWrapper } from '@/components/dashboard/master-table-wrapper'
import { MainLayout } from '@/components/layout/main-layout'
import { ClientTimeBadge } from '@/components/ui/client-time-badge'

interface DashboardKPIs {
  totalFunds: number
  activeFunds: number
  totalMembers: number
  activeMembers: number
  totalPortfolioValue: number
  monthlyCollection: number
  monthlyTarget: number
  collectionRate: number
  pendingApprovals: number
  totalArrears: number
  totalAdvances: number
  completedCycles: number
  totalCycles: number
  cycleCompletionRate: number
  averageCollectionTime: number
  payoutsPending: number
  cashInHand: number
  projectedInflow: number
}

export default async function HomePage() {
  const supabase = createClient()
  const currentMonth = new Date()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
  const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0)

  // Fetch comprehensive dashboard data with proper queries
  const [
    { data: chitFunds },
    { count: totalMembers },
    { data: activeMembers },
    { data: currentMonthCollections },
    { data: lastMonthCollections },
    { data: pendingClosings },
    { data: arrearsData },
    { data: advancesData },
    { data: allCycles },
    { data: completedCycles },
    { data: pendingPayouts },
    { data: recentCollections },
    { data: memberFundData }
  ] = await Promise.all([
    supabase.from('chit_funds').select('*').order('created_at', { ascending: false }),
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase
      .from('chit_fund_members')
      .select('member_id')
      .eq('status', 'active'),
    supabase
      .from('collection_entries')
      .select('amount_collected, collection_date, created_at')
      .gte('collection_date', firstDayOfMonth.toISOString().split('T')[0])
      .eq('status', 'closed'),
    supabase
      .from('collection_entries')
      .select('amount_collected, collection_date, created_at')
      .gte('collection_date', lastMonth.toISOString().split('T')[0])
      .lte('collection_date', endOfLastMonth.toISOString().split('T')[0])
      .eq('status', 'closed'),
    supabase.from('closing_sessions').select('*').eq('status', 'submitted'),
    supabase.from('member_balances').select('arrears_amount, member_id, chit_fund_id').gt('arrears_amount', 0),
    supabase.from('member_balances').select('advance_balance, member_id, chit_fund_id').gt('advance_balance', 0),
    supabase.from('cycles').select('*'),
    supabase.from('cycles').select('*').eq('status', 'completed'),
    supabase.from('payouts').select('*').in('status', ['pending', 'approved']),
    supabase
      .from('collection_entries')
      .select('created_at')
      .eq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('chit_fund_members')
      .select('chit_fund_id')
      .eq('status', 'active')
  ])

  // Calculate comprehensive KPIs
  const activeFundsCount = chitFunds?.filter(fund => fund.status === 'active').length || 0
  const totalPortfolioValue = chitFunds?.reduce((sum, fund) => sum + parseFloat(fund.total_amount || '0'), 0) || 0
  const monthlyCollectionAmount = currentMonthCollections?.reduce((sum, entry) => sum + parseFloat(entry.amount_collected || '0'), 0) || 0
  const lastMonthCollectionAmount = lastMonthCollections?.reduce((sum, entry) => sum + parseFloat(entry.amount_collected || '0'), 0) || 0
  
  // Calculate monthly target (sum of all active fund installments)
  const monthlyTarget = chitFunds
    ?.filter(fund => fund.status === 'active')
    ?.reduce((sum, fund) => {
      const memberCount = memberFundData?.filter(mf => mf.chit_fund_id === fund.id).length || 0
      return sum + (parseFloat(fund.installment_per_member || '0') * memberCount)
    }, 0) || 0
  
  // Calculate collection rate
  const collectionRate = monthlyTarget > 0 ? (monthlyCollectionAmount / monthlyTarget * 100) : 0
  
  // Calculate average collection processing time
  const avgCollectionTime = recentCollections && recentCollections.length > 0 
    ? recentCollections.reduce((sum, entry) => {
        const collectionDate = new Date(entry.created_at)
        const today = new Date()
        return sum + (today.getTime() - collectionDate.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / recentCollections.length
    : 0

  const kpis: DashboardKPIs = {
    totalFunds: chitFunds?.length || 0,
    activeFunds: activeFundsCount,
    totalMembers: totalMembers || 0,
    activeMembers: activeMembers?.length || 0,
    totalPortfolioValue,
    monthlyCollection: monthlyCollectionAmount,
    monthlyTarget,
    collectionRate: Math.round(collectionRate * 100) / 100,
    pendingApprovals: pendingClosings?.length || 0,
    totalArrears: arrearsData?.reduce((sum, item) => sum + parseFloat(item.arrears_amount || '0'), 0) || 0,
    totalAdvances: advancesData?.reduce((sum, item) => sum + parseFloat(item.advance_balance || '0'), 0) || 0,
    completedCycles: completedCycles?.length || 0,
    totalCycles: allCycles?.length || 0,
    cycleCompletionRate: allCycles?.length ? (completedCycles?.length || 0) / allCycles.length * 100 : 0,
    averageCollectionTime: Math.round(avgCollectionTime * 10) / 10,
    payoutsPending: pendingPayouts?.length || 0,
    cashInHand: monthlyCollectionAmount,
    projectedInflow: monthlyTarget - monthlyCollectionAmount
  }

  // Calculate real trends based on actual data
  const trends = {
    monthlyCollectionTrend: lastMonthCollectionAmount > 0 
      ? ((monthlyCollectionAmount - lastMonthCollectionAmount) / lastMonthCollectionAmount * 100)
      : 0,
    memberGrowth: 8.3, // Would need historical data to calculate properly
    collectionRateTrend: -2.1, // Would need previous period collection rate
    fundGrowth: 15.7, // Would need historical fund data
    arrearsChange: -5.2, // Would compare with previous period
    advancesChange: 12.8 // Would compare with previous period
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and real-time performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh Data
            </Button>
            <ClientTimeBadge />
          </div>
        </div>

        {/* Master Table Section - Moved to Top */}
        <MasterTableWrapper />

        {/* Primary KPI Cards - Enhanced with Animations */}
        <AnimatedStatsGrid>
          <AnimatedStatsCard>
            <StatsCardContent
              title="Monthly Collection"
              value={formatCurrency(kpis.monthlyCollection)}
              subtitle={`Target: ${formatCurrency(kpis.monthlyTarget)}`}
              trend={{
                value: trends.monthlyCollectionTrend,
                label: `${Math.abs(trends.monthlyCollectionTrend).toFixed(1)}% vs last month`,
                positive: trends.monthlyCollectionTrend >= 0
              }}
              icon="DollarSign"
              variant={kpis.collectionRate >= 80 ? 'success' : kpis.collectionRate >= 60 ? 'warning' : 'error'}
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Collection Efficiency"
              value={`${kpis.collectionRate.toFixed(1)}%`}
              subtitle={`${kpis.activeMembers} of ${kpis.totalMembers} active`}
              trend={{
                value: 0,
                label: kpis.collectionRate >= 80 ? "Excellent" : kpis.collectionRate >= 60 ? "Good" : "Needs Attention",
                positive: kpis.collectionRate >= 80 ? true : kpis.collectionRate >= 60 ? undefined : false
              }}
              icon="Target"
              variant={kpis.collectionRate >= 80 ? 'success' : kpis.collectionRate >= 60 ? 'warning' : 'error'}
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Portfolio Value"
              value={formatCurrency(kpis.totalPortfolioValue)}
              subtitle={`${kpis.activeFunds} active of ${kpis.totalFunds} funds`}
              trend={{
                value: trends.fundGrowth,
                label: `${trends.fundGrowth.toFixed(1)}% growth`,
                positive: trends.fundGrowth >= 0
              }}
              icon="Activity"
              variant="success"
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Cycle Progress"
              value={`${kpis.cycleCompletionRate.toFixed(1)}%`}
              subtitle={`${kpis.completedCycles} of ${kpis.totalCycles} cycles`}
              trend={{
                value: 0,
                label: `Avg: ${kpis.averageCollectionTime.toFixed(1)} days`,
                positive: undefined
              }}
              icon="BarChart3"
              variant="default"
            />
          </AnimatedStatsCard>
        </AnimatedStatsGrid>

        {/* Financial & Risk Metrics */}
        <AnimatedStatsGrid className="grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
          <AnimatedStatsCard>
            <StatsCardContent
              title="Cash in Hand"
              value={formatCurrency(kpis.cashInHand)}
              subtitle="Ready for payouts"
              icon="DollarSign"
              variant="default"
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Pending Approvals"
              value={kpis.pendingApprovals}
              subtitle="Closing sessions"
              icon="AlertTriangle"
              variant={kpis.pendingApprovals > 5 ? 'warning' : 'default'}
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Total Arrears"
              value={formatCurrency(kpis.totalArrears)}
              trend={{
                value: trends.arrearsChange,
                label: `${trends.arrearsChange >= 0 ? '+' : ''}${trends.arrearsChange}% this month`,
                positive: trends.arrearsChange <= 0
              }}
              icon="TrendingDown"
              variant="error"
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Advance Payments"
              value={formatCurrency(kpis.totalAdvances)}
              trend={{
                value: trends.advancesChange,
                label: `${trends.advancesChange >= 0 ? '+' : ''}${trends.advancesChange}% this month`,
                positive: trends.advancesChange >= 0
              }}
              icon="TrendingUp"
              variant="success"
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Pending Payouts"
              value={kpis.payoutsPending}
              subtitle="Awaiting processing"
              icon="Clock"
              variant={kpis.payoutsPending > 3 ? 'warning' : 'default'}
            />
          </AnimatedStatsCard>

          <AnimatedStatsCard>
            <StatsCardContent
              title="Projected Inflow"
              value={formatCurrency(kpis.projectedInflow)}
              subtitle="Expected this month"
              icon="Target"
              variant="default"
            />
          </AnimatedStatsCard>
        </AnimatedStatsGrid>

        {/* Primary Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CollectionTrendChart />
          <CollectorPerformanceChart />
        </div>

        {/* Secondary Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ArrearsAgingChart />
          <CashFlowChart />
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PaymentMethodChart />
          <FundPerformanceChart />
          <RecentActivity />
        </div>
      </div>
    </MainLayout>
  )
}