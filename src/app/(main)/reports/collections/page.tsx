'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Download
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

// Mock data for collection reports
const collectionTrends = [
  { date: '2024-08-01', collected: 45000, target: 50000, efficiency: 90 },
  { date: '2024-08-02', collected: 52000, target: 50000, efficiency: 104 },
  { date: '2024-08-03', collected: 35000, target: 45000, efficiency: 78 },
  { date: '2024-08-04', collected: 48000, target: 50000, efficiency: 96 },
  { date: '2024-08-05', collected: 61000, target: 55000, efficiency: 111 },
  { date: '2024-08-06', collected: 39000, target: 45000, efficiency: 87 },
  { date: '2024-08-07', collected: 58000, target: 60000, efficiency: 97 },
]

const collectorPerformance = [
  { name: 'Rajesh Kumar', collections: 125000, target: 120000, efficiency: 104, members: 25 },
  { name: 'Priya Singh', collections: 98000, target: 100000, efficiency: 98, members: 20 },
  { name: 'Amit Sharma', collections: 87000, target: 90000, efficiency: 97, members: 18 },
  { name: 'Meera Patel', collections: 112000, target: 110000, efficiency: 102, members: 22 },
  { name: 'Suresh Reddy', collections: 76000, target: 80000, efficiency: 95, members: 16 },
]

const paymentMethods = [
  { name: 'Cash', value: 65, amount: 325000, color: '#ef4444' },
  { name: 'Bank Transfer', value: 25, amount: 125000, color: '#3b82f6' },
  { name: 'UPI', value: 7, amount: 35000, color: '#10b981' },
  { name: 'Cheque', value: 3, amount: 15000, color: '#f59e0b' }
]

const fundCollectionStatus = [
  { fund: 'Premium Fund', collected: 485000, target: 500000, completion: 97, members: 25, overdue: 2 },
  { fund: 'Gold Fund', collected: 890000, target: 900000, completion: 99, members: 30, overdue: 1 },
  { fund: 'Standard Fund', collected: 234000, target: 300000, completion: 78, members: 20, overdue: 5 },
  { fund: 'Silver Fund', collected: 445000, target: 600000, completion: 74, members: 24, overdue: 7 },
  { fund: 'Bronze Fund', collected: 167000, target: 200000, completion: 84, members: 15, overdue: 3 },
]

export default function CollectionReportsPage() {
  const totalCollected = collectorPerformance.reduce((sum, collector) => sum + collector.collections, 0)
  const totalTarget = collectorPerformance.reduce((sum, collector) => sum + collector.target, 0)
  const overallEfficiency = ((totalCollected / totalTarget) * 100).toFixed(1)
  const totalMembers = collectorPerformance.reduce((sum, collector) => sum + collector.members, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collection Reports</h1>
          <p className="text-muted-foreground">
            Track collection performance, efficiency, and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="thismonth">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisweek">This Week</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
              <SelectItem value="lastmonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCollected)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallEfficiency}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +2.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
              95% payment compliance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {fundCollectionStatus.reduce((sum, fund) => sum + fund.overdue, 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -12% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Collection Trends</TabsTrigger>
          <TabsTrigger value="performance">Collector Performance</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="funds">Fund-wise Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Collection Trends</CardTitle>
              <CardDescription>Collection performance vs targets over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={collectionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value).replace('₹', '₹')} />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value, name) => [formatCurrency(Number(value)), name === 'collected' ? 'Collected' : 'Target']}
                    />
                    <Line type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(collectionTrends.reduce((sum, day) => sum + day.collected, 0))}
                  </div>
                  <div className="text-muted-foreground">Total Collected (7 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(collectionTrends.reduce((sum, day) => sum + day.target, 0))}
                  </div>
                  <div className="text-muted-foreground">Total Target (7 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {((collectionTrends.reduce((sum, day) => sum + day.collected, 0) / 
                       collectionTrends.reduce((sum, day) => sum + day.target, 0)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">Average Efficiency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collector Performance Ranking</CardTitle>
              <CardDescription>Individual collector efficiency and collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectorPerformance
                  .sort((a, b) => b.efficiency - a.efficiency)
                  .map((collector, index) => (
                    <div key={collector.name} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{collector.name}</div>
                          <div className="text-sm text-muted-foreground">{collector.members} members</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(collector.collections)}</div>
                          <div className="text-sm text-muted-foreground">Collections</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(collector.target)}</div>
                          <div className="text-sm text-muted-foreground">Target</div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className={`text-lg font-bold ${collector.efficiency >= 100 ? 'text-green-600' : collector.efficiency >= 90 ? 'text-orange-600' : 'text-red-600'}`}>
                            {collector.efficiency}%
                          </div>
                          <div className="text-sm text-muted-foreground">Efficiency</div>
                        </div>
                        <div className="w-24">
                          <Progress 
                            value={Math.min(collector.efficiency, 100)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
                <CardDescription>How members prefer to pay</CardDescription>
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
                        dataKey="value"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [
                        `${value}% (${formatCurrency(props.payload.amount)})`,
                        name
                      ]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method Details</CardTitle>
                <CardDescription>Breakdown by amount and percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: method.color }}
                        />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(method.amount)}</div>
                        <div className="text-sm text-muted-foreground">{method.value}% of total</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Total Collections</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(paymentMethods.reduce((sum, method) => sum + method.amount, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fund-wise Collection Analysis</CardTitle>
              <CardDescription>Performance breakdown by chit fund</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fundCollectionStatus.map((fund) => (
                  <div key={fund.fund} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium text-lg">{fund.fund}</div>
                        <div className="text-sm text-muted-foreground">
                          {fund.members} members • {fund.overdue} overdue
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${fund.completion >= 95 ? 'text-green-600' : fund.completion >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
                          {fund.completion}%
                        </div>
                        <div className="text-sm text-muted-foreground">Completion</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Collected</div>
                        <div className="font-medium">{formatCurrency(fund.collected)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Target</div>
                        <div className="font-medium">{formatCurrency(fund.target)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={fund.completion} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹0</span>
                        <span>{formatCurrency(fund.target)}</span>
                      </div>
                    </div>
                    
                    {fund.overdue > 0 && (
                      <div className="mt-3 flex items-center text-sm">
                        <AlertTriangle className="mr-1 h-4 w-4 text-orange-500" />
                        <span className="text-orange-600">
                          {fund.overdue} member{fund.overdue > 1 ? 's' : ''} with overdue payments
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}