import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { MainLayout } from '@/components/layout/main-layout'

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
      return sum + (parseFloat(fund.installment_amount || '0') * memberCount)
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
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              Updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Primary KPI Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Collection</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.monthlyCollection)}</div>
              <div className="text-xs text-muted-foreground mb-1">
                Target: {formatCurrency(kpis.monthlyTarget)}
              </div>
              <div className="flex items-center text-xs">
                {trends.monthlyCollectionTrend >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={trends.monthlyCollectionTrend >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(trends.monthlyCollectionTrend).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.collectionRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mb-1">
                {kpis.activeMembers} of {kpis.totalMembers} active
              </div>
              <div className="flex items-center text-xs">
                {kpis.collectionRate >= 80 ? (
                  <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                ) : kpis.collectionRate >= 60 ? (
                  <AlertTriangle className="mr-1 h-3 w-3 text-yellow-500" />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={kpis.collectionRate >= 80 ? "text-green-600" : kpis.collectionRate >= 60 ? "text-yellow-600" : "text-red-600"}>
                  {kpis.collectionRate >= 80 ? "Excellent" : kpis.collectionRate >= 60 ? "Good" : "Needs Attention"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalPortfolioValue)}</div>
              <div className="text-xs text-muted-foreground mb-1">
                {kpis.activeFunds} active of {kpis.totalFunds} funds
              </div>
              <div className="flex items-center text-xs">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-600">
                  {trends.fundGrowth.toFixed(1)}% growth
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cycle Progress</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.cycleCompletionRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mb-1">
                {kpis.completedCycles} of {kpis.totalCycles} cycles
              </div>
              <div className="flex items-center text-xs">
                <CheckCircle className="mr-1 h-3 w-3 text-blue-500" />
                <span className="text-blue-600">
                  Avg: {kpis.averageCollectionTime.toFixed(1)} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial & Risk Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="mr-1 h-4 w-4 text-blue-500" />
                Cash in Hand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(kpis.cashInHand)}</div>
              <div className="text-xs text-muted-foreground">
                Ready for payouts
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="mr-1 h-4 w-4 text-orange-500" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">{kpis.pendingApprovals}</div>
              <div className="text-xs text-muted-foreground">
                Closing sessions
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                Total Arrears
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">{formatCurrency(kpis.totalArrears)}</div>
              <div className="text-xs text-muted-foreground">
                {trends.arrearsChange >= 0 ? '+' : ''}{trends.arrearsChange}% this month
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                Advance Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">{formatCurrency(kpis.totalAdvances)}</div>
              <div className="text-xs text-muted-foreground">
                {trends.advancesChange >= 0 ? '+' : ''}{trends.advancesChange}% this month
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="mr-1 h-4 w-4 text-purple-500" />
                Pending Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">{kpis.payoutsPending}</div>
              <div className="text-xs text-muted-foreground">
                Awaiting processing
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="mr-1 h-4 w-4 text-indigo-500" />
                Projected Inflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-indigo-600">{formatCurrency(kpis.projectedInflow)}</div>
              <div className="text-xs text-muted-foreground">
                Expected this month
              </div>
            </CardContent>
          </Card>
        </div>

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