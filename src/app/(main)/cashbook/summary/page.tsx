'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  DollarSign,
  TrendingUp, 
  TrendingDown, 
  BookOpen,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'

interface DailySummary {
  transaction_date: string
  total_cash_in: number
  total_cash_out: number
  net_cash_flow: number
  cash_in_transactions: number
  cash_out_transactions: number
  total_transactions: number
}

interface MonthlySummary {
  month_name: string
  total_cash_in: number
  total_cash_out: number
  net_cash_flow: number
  cash_in_transactions: number
  cash_out_transactions: number
  total_transactions: number
}

interface CashPosition {
  chit_fund_id: string
  fund_name: string
  current_cash_balance: number
  today_cash_in: number
  today_cash_out: number
  today_net_flow: number
  activity_status: string
  last_transaction_date: string | null
}

interface PaymentMethodStats {
  method: string
  amount: number
  count: number
  percentage: number
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

export default function CashbookSummaryPage() {
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([])
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([])
  const [cashPositions, setCashPositions] = useState<CashPosition[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30days')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [selectedPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch daily summary
      const daysLimit = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_cashbook_summary')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(daysLimit)
      
      if (dailyError) throw dailyError
      setDailySummary((dailyData || []).reverse())
      
      // Fetch monthly summary
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_cashbook_summary')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12)
      
      if (monthlyError) throw monthlyError
      setMonthlySummary((monthlyData || []).reverse())
      
      // Fetch cash positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('cash_position_summary')
        .select('*')
        .order('fund_name')
      
      if (positionsError) throw positionsError
      setCashPositions(positionsData || [])
      
      // Fetch payment method stats
      const { data: methodData, error: methodError } = await supabase
        .from('cashbook')
        .select('payment_method, amount')
        .eq('status', 'confirmed')
        .eq('transaction_type', 'cash_in')
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      
      if (methodError) throw methodError
      
      // Process payment method stats
      const methodStats: Record<string, { amount: number; count: number }> = {}
      let totalAmount = 0
      
      methodData?.forEach(entry => {
        if (!methodStats[entry.payment_method]) {
          methodStats[entry.payment_method] = { amount: 0, count: 0 }
        }
        methodStats[entry.payment_method].amount += entry.amount
        methodStats[entry.payment_method].count += 1
        totalAmount += entry.amount
      })
      
      const methodStatsArray = Object.entries(methodStats).map(([method, stats]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        amount: stats.amount,
        count: stats.count,
        percentage: (stats.amount / totalAmount) * 100
      }))
      
      setPaymentMethods(methodStatsArray)
      
    } catch (error) {
      console.error('Error fetching cashbook summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTodaysSummary = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayData = dailySummary.find(d => d.transaction_date === today)
    
    return {
      cashIn: todayData?.total_cash_in || 0,
      cashOut: todayData?.total_cash_out || 0,
      netFlow: todayData?.net_cash_flow || 0,
      transactions: todayData?.total_transactions || 0
    }
  }

  const getTotalCashPosition = () => {
    return cashPositions.reduce((total, position) => total + position.current_cash_balance, 0)
  }

  const getActivityStatusCounts = () => {
    const counts = {
      'Active Today': 0,
      'Recent Activity': 0,
      'Some Activity': 0,
      'Low Activity': 0,
      'No Activity': 0
    }
    
    cashPositions.forEach(position => {
      if (counts[position.activity_status as keyof typeof counts] !== undefined) {
        counts[position.activity_status as keyof typeof counts]++
      }
    })
    
    return counts
  }

  const formatChartData = (data: DailySummary[] | MonthlySummary[]) => {
    return data.map(item => ({
      ...item,
      date: 'transaction_date' in item ? 
        formatDate(item.transaction_date) : 
        item.month_name,
      cashIn: item.total_cash_in,
      cashOut: item.total_cash_out,
      netFlow: item.net_cash_flow
    }))
  }

  const todaysSummary = getTodaysSummary()
  const totalCashPosition = getTotalCashPosition()
  const activityCounts = getActivityStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cashbook summary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cashbook Summary</h1>
          <p className="text-muted-foreground">
            Overview of cash movements and financial position
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Cash In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(todaysSummary.cashIn)}
            </div>
            <p className="text-xs text-muted-foreground">
              Collections received today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Cash Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(todaysSummary.cashOut)}
            </div>
            <p className="text-xs text-muted-foreground">
              Payouts made today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Net Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              todaysSummary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(todaysSummary.netFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysSummary.transactions} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Position</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCashPosition)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all chit funds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="funds">Fund Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Cash Flow</CardTitle>
                <CardDescription>Cash in vs cash out over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData(dailySummary)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('₹', '₹')} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="cashIn" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="cashOut" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Net Cash Flow Trend</CardTitle>
                <CardDescription>Daily net position (in - out)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData(dailySummary)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value).replace('₹', '₹')} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line 
                        type="monotone" 
                        dataKey="netFlow" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow Analysis</CardTitle>
              <CardDescription>Monthly aggregated cash movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatChartData(monthlySummary)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('₹', '₹')} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="cashIn" fill="#10b981" name="Cash In" />
                    <Bar dataKey="cashOut" fill="#ef4444" name="Cash Out" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
                <CardDescription>Cash inflow by payment method (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="method"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method Details</CardTitle>
                <CardDescription>Breakdown by method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(method.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {method.count} transactions ({method.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funds" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fund-wise Cash Positions</CardTitle>
                <CardDescription>Current cash balance by chit fund</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashPositions.slice(0, 10).map((position) => (
                    <div key={position.chit_fund_id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{position.fund_name}</div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge 
                            variant={position.activity_status === 'Active Today' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {position.activity_status}
                          </Badge>
                          {position.last_transaction_date && (
                            <span>Last: {formatDate(position.last_transaction_date)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(position.current_cash_balance)}</div>
                        {position.today_net_flow !== 0 && (
                          <div className={`text-sm ${
                            position.today_net_flow >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Today: {formatCurrency(position.today_net_flow)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fund Activity Status</CardTitle>
                <CardDescription>Activity levels across all funds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(activityCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {status === 'Active Today' && <Activity className="h-4 w-4 text-green-600" />}
                        {status === 'Recent Activity' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                        {status === 'Some Activity' && <Clock className="h-4 w-4 text-yellow-600" />}
                        {status === 'Low Activity' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                        {status === 'No Activity' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        <span className="font-medium">{status}</span>
                      </div>
                      <div className="font-medium">{count} funds</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}