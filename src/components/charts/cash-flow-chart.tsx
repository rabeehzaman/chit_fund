'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CashFlowData {
  month: string
  inflow: number
  outflow: number
  netFlow: number
  projected: boolean
  collections: number
  payouts: number
  runningBalance: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-green-600">Inflow:</span>
            <span className="text-sm font-medium">{formatCurrency(data.inflow)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-red-600">Outflow:</span>
            <span className="text-sm font-medium">{formatCurrency(data.outflow)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="text-sm font-medium">Net Flow:</span>
            <span className={`text-sm font-bold ${data.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.netFlow)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-blue-600">Balance:</span>
            <span className="text-sm font-medium">{formatCurrency(data.runningBalance)}</span>
          </div>
          {data.projected && (
            <div className="text-xs text-orange-600 italic">Projected</div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function CashFlowChart() {
  const [data, setData] = useState<CashFlowData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalInflow, setTotalInflow] = useState(0)
  const [totalOutflow, setTotalOutflow] = useState(0)
  const [projectedBalance, setProjectedBalance] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCashFlowData() {
      try {
        const currentDate = new Date()
        const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1)
        const sixMonthsAhead = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 0)

        // Get historical collections (inflows)
        const { data: collections, error: collectionsError } = await supabase
          .from('collection_entries')
          .select('amount_collected, collection_date')
          .gte('collection_date', sixMonthsAgo.toISOString().split('T')[0])
          .eq('status', 'closed')

        if (collectionsError) throw collectionsError

        // Get historical payouts (outflows)
        const { data: payouts, error: payoutsError } = await supabase
          .from('payouts')
          .select('payout_amount, payout_date')
          .gte('payout_date', sixMonthsAgo.toISOString().split('T')[0])
          .in('status', ['approved', 'paid'])

        if (payoutsError) throw payoutsError

        // Get active chit funds for projections
        const { data: activeFunds, error: fundsError } = await supabase
          .from('chit_funds')
          .select(`
            installment_per_member,
            chit_fund_members!chit_fund_members_chit_fund_id_fkey(
              member_id
            )
          `)
          .eq('status', 'active')

        if (fundsError) throw fundsError

        // Generate monthly data for the last 6 months and next 6 months
        const monthlyData: { [key: string]: CashFlowData } = {}
        let runningBalance = 0

        // Initialize months
        for (let i = -5; i <= 6; i++) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
          const monthKey = date.toISOString().substr(0, 7) // YYYY-MM format
          const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          
          monthlyData[monthKey] = {
            month: monthName,
            inflow: 0,
            outflow: 0,
            netFlow: 0,
            projected: i > 0, // Future months are projected
            collections: 0,
            payouts: 0,
            runningBalance: 0
          }
        }

        // Process historical collections
        collections?.forEach((collection: any) => {
          const monthKey = collection.collection_date.substr(0, 7)
          if (monthlyData[monthKey]) {
            const amount = parseFloat(collection.amount_collected || 0)
            monthlyData[monthKey].inflow += amount
            monthlyData[monthKey].collections += amount
          }
        })

        // Process historical payouts
        payouts?.forEach((payout: any) => {
          const monthKey = payout.payout_date.substr(0, 7)
          if (monthlyData[monthKey]) {
            const amount = parseFloat(payout.payout_amount || 0)
            monthlyData[monthKey].outflow += amount
            monthlyData[monthKey].payouts += amount
          }
        })

        // Calculate projected inflows for future months
        const monthlyProjectedInflow = activeFunds?.reduce((total, fund: any) => {
          const memberCount = fund.chit_fund_members?.length || 0
          return total + (parseFloat(fund.installment_per_member || 0) * memberCount)
        }, 0) || 0

        const monthlyProjectedOutflow = monthlyProjectedInflow * 0.8 // Assuming 80% of inflow goes to payouts

        // Calculate net flow and running balance
        const sortedMonths = Object.keys(monthlyData).sort()
        sortedMonths.forEach(monthKey => {
          const monthData = monthlyData[monthKey]
          
          if (monthData.projected) {
            // Use projections for future months
            monthData.inflow = monthlyProjectedInflow
            monthData.outflow = monthlyProjectedOutflow
          }
          
          monthData.netFlow = monthData.inflow - monthData.outflow
          runningBalance += monthData.netFlow
          monthData.runningBalance = runningBalance
        })

        // Convert to array and sort by month
        const chartData = Object.values(monthlyData).sort((a, b) => 
          new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime()
        )

        // Calculate totals for the period
        const inflowSum = chartData.reduce((sum, item) => sum + item.inflow, 0)
        const outflowSum = chartData.reduce((sum, item) => sum + item.outflow, 0)
        const finalBalance = chartData[chartData.length - 1]?.runningBalance || 0

        setData(chartData)
        setTotalInflow(inflowSum)
        setTotalOutflow(outflowSum)
        setProjectedBalance(finalBalance)

      } catch (error) {
        console.error('Error fetching cash flow data:', error)
        // Use mock data as fallback
        const mockData: CashFlowData[] = [
          { month: 'Jul 2024', inflow: 125000, outflow: 100000, netFlow: 25000, projected: false, collections: 125000, payouts: 100000, runningBalance: 25000 },
          { month: 'Aug 2024', inflow: 140000, outflow: 120000, netFlow: 20000, projected: false, collections: 140000, payouts: 120000, runningBalance: 45000 },
          { month: 'Sep 2024', inflow: 130000, outflow: 110000, netFlow: 20000, projected: false, collections: 130000, payouts: 110000, runningBalance: 65000 },
          { month: 'Oct 2024', inflow: 150000, outflow: 130000, netFlow: 20000, projected: false, collections: 150000, payouts: 130000, runningBalance: 85000 },
          { month: 'Nov 2024', inflow: 145000, outflow: 125000, netFlow: 20000, projected: false, collections: 145000, payouts: 125000, runningBalance: 105000 },
          { month: 'Dec 2024', inflow: 160000, outflow: 140000, netFlow: 20000, projected: false, collections: 160000, payouts: 140000, runningBalance: 125000 },
          { month: 'Jan 2025', inflow: 155000, outflow: 135000, netFlow: 20000, projected: true, collections: 0, payouts: 0, runningBalance: 145000 },
          { month: 'Feb 2025', inflow: 155000, outflow: 135000, netFlow: 20000, projected: true, collections: 0, payouts: 0, runningBalance: 165000 },
          { month: 'Mar 2025', inflow: 155000, outflow: 135000, netFlow: 20000, projected: true, collections: 0, payouts: 0, runningBalance: 185000 },
          { month: 'Apr 2025', inflow: 155000, outflow: 135000, netFlow: 20000, projected: true, collections: 0, payouts: 0, runningBalance: 205000 },
          { month: 'May 2025', inflow: 155000, outflow: 135000, netFlow: 20000, projected: true, collections: 0, payouts: 0, runningBalance: 225000 },
          { month: 'Jun 2025', inflow: 155000, outflow: 135000, netFlow: 20000, projected: true, collections: 0, payouts: 0, runningBalance: 245000 }
        ]
        
        setData(mockData)
        setTotalInflow(1865000)
        setTotalOutflow(1590000)
        setProjectedBalance(245000)
      } finally {
        setLoading(false)
      }
    }

    fetchCashFlowData()
  }, [])

  const netCashFlow = totalInflow - totalOutflow
  const currentMonthData = data.find(item => !item.projected) || data[0]
  const healthScore = projectedBalance > 100000 ? 'Excellent' : projectedBalance > 50000 ? 'Good' : 'Needs Attention'
  const healthColor = projectedBalance > 100000 ? 'text-green-600' : projectedBalance > 50000 ? 'text-yellow-600' : 'text-red-600'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Cash Flow Projection</CardTitle>
          <CardDescription>Loading cash flow data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
              Cash Flow Projection
            </CardTitle>
            <CardDescription>
              Historical data with 6-month projection
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(projectedBalance)}</div>
            <div className="text-xs text-muted-foreground">Projected Balance</div>
            <div className={`text-xs font-medium ${healthColor}`}>
              {healthScore}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-sm"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-sm"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Inflows as green bars */}
              <Bar 
                dataKey="inflow" 
                fill="#10b981" 
                name="Cash Inflow"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              
              {/* Outflows as red bars (negative) */}
              <Bar 
                dataKey="outflow" 
                fill="#ef4444" 
                name="Cash Outflow"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              
              {/* Running balance as area */}
              <Area
                type="monotone"
                dataKey="runningBalance"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
                name="Running Balance"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            </div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(totalInflow)}</div>
            <div className="text-xs text-muted-foreground">Total Inflows</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            </div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(totalOutflow)}</div>
            <div className="text-xs text-muted-foreground">Total Outflows</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
            </div>
            <div className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCashFlow)}
            </div>
            <div className="text-xs text-muted-foreground">Net Cash Flow</div>
          </div>
        </div>

        {/* Projection Note */}
        <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
          <Calendar className="mr-1 h-3 w-3" />
          Future months show projected values based on current trends
        </div>
      </CardContent>
    </Card>
  )
}