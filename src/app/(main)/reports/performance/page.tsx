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
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  BarChart3
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'

// Mock data for performance reports
const systemKPIs = [
  { metric: 'Collection Rate', current: 94.5, target: 95, trend: 2.3, status: 'good' },
  { metric: 'Member Satisfaction', current: 88, target: 90, trend: -1.2, status: 'warning' },
  { metric: 'Processing Speed', current: 96.2, target: 95, trend: 4.5, status: 'excellent' },
  { metric: 'Fund Completion', current: 92.1, target: 90, trend: 1.8, status: 'excellent' },
  { metric: 'Cost Efficiency', current: 85.3, target: 85, trend: 3.2, status: 'good' },
  { metric: 'Risk Management', current: 97.8, target: 95, trend: 0.9, status: 'excellent' }
]

const radarData = [
  { subject: 'Collections', A: 94.5, fullMark: 100 },
  { subject: 'Efficiency', A: 88.3, fullMark: 100 },
  { subject: 'Member Satisfaction', A: 87.9, fullMark: 100 },
  { subject: 'Risk Management', A: 96.2, fullMark: 100 },
  { subject: 'Growth', A: 82.1, fullMark: 100 },
  { subject: 'Profitability', A: 91.5, fullMark: 100 },
]

const collectorRankings = [
  { name: 'Rajesh Kumar', score: 98.5, collections: 125000, efficiency: 104, members: 25, satisfaction: 4.8 },
  { name: 'Meera Patel', score: 96.8, collections: 112000, efficiency: 102, members: 22, satisfaction: 4.9 },
  { name: 'Priya Singh', score: 94.2, collections: 98000, efficiency: 98, members: 20, satisfaction: 4.6 },
  { name: 'Amit Sharma', score: 92.7, collections: 87000, efficiency: 97, members: 18, satisfaction: 4.5 },
  { name: 'Suresh Reddy', score: 89.1, collections: 76000, efficiency: 95, members: 16, satisfaction: 4.3 },
]

const monthlyPerformance = [
  { month: 'Feb', collections: 98.2, efficiency: 94.5, satisfaction: 87.3 },
  { month: 'Mar', collections: 96.8, efficiency: 96.1, satisfaction: 88.1 },
  { month: 'Apr', collections: 94.1, efficiency: 93.7, satisfaction: 86.9 },
  { month: 'May', collections: 97.3, efficiency: 95.8, satisfaction: 89.2 },
  { month: 'Jun', collections: 99.1, efficiency: 97.2, satisfaction: 90.1 },
  { month: 'Jul', collections: 95.7, efficiency: 94.9, satisfaction: 88.8 },
  { month: 'Aug', collections: 98.9, efficiency: 96.5, satisfaction: 89.5 },
]

const fundEfficiency = [
  { fund: 'Premium Fund', members: 25, collections: 97, cycles: 8, payout: 92, efficiency: 94.5 },
  { fund: 'Gold Fund', members: 30, collections: 99, cycles: 5, payout: 95, efficiency: 97.2 },
  { fund: 'Standard Fund', members: 20, collections: 78, cycles: 12, payout: 88, efficiency: 81.5 },
  { fund: 'Silver Fund', members: 24, collections: 74, cycles: 9, payout: 85, efficiency: 79.8 },
  { fund: 'Bronze Fund', members: 15, collections: 84, cycles: 6, payout: 90, efficiency: 87.3 },
]

const riskMetrics = [
  { category: 'Payment Default Risk', score: 95, trend: 2.1, status: 'low' },
  { category: 'Liquidity Risk', score: 88, trend: -1.5, status: 'medium' },
  { category: 'Operational Risk', score: 92, trend: 3.2, status: 'low' },
  { category: 'Market Risk', score: 85, trend: 0.8, status: 'medium' },
]

export default function PerformanceReportsPage() {
  const overallScore = systemKPIs.reduce((sum, kpi) => sum + kpi.current, 0) / systemKPIs.length
  const excellentKPIs = systemKPIs.filter(kpi => kpi.status === 'excellent').length
  const warningKPIs = systemKPIs.filter(kpi => kpi.status === 'warning').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground">
            System-wide performance metrics and operational efficiency analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="thismonth">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisweek">This Week</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
              <SelectItem value="thisquarter">This Quarter</SelectItem>
              <SelectItem value="thisyear">This Year</SelectItem>
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
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallScore.toFixed(1)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +2.8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excellent KPIs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{excellentKPIs}/6</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
              Above target performance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Areas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{warningKPIs}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertTriangle className="mr-1 h-3 w-3 text-orange-500" />
              Need attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{collectorRankings[0]?.name}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Award className="mr-1 h-3 w-3 text-gold-500" />
              Score: {collectorRankings[0]?.score}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="collectors">Collector Rankings</TabsTrigger>
          <TabsTrigger value="funds">Fund Efficiency</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KPI Scorecard */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>System-wide performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemKPIs.map((kpi) => (
                    <div key={kpi.metric} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          kpi.status === 'excellent' ? 'bg-green-500' :
                          kpi.status === 'good' ? 'bg-blue-500' :
                          kpi.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium">{kpi.metric}</div>
                          <div className="text-sm text-muted-foreground">Target: {kpi.target}%</div>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <div>
                          <div className="text-lg font-bold">{kpi.current}%</div>
                          <div className={`text-xs flex items-center ${
                            kpi.trend > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {kpi.trend > 0 ? 
                              <TrendingUp className="mr-1 h-3 w-3" /> : 
                              <TrendingDown className="mr-1 h-3 w-3" />
                            }
                            {Math.abs(kpi.trend)}%
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(kpi.current, 100)} 
                          className="w-16 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>Multi-dimensional performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={false}
                      />
                      <Radar 
                        name="Current Performance" 
                        dataKey="A" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-lg font-bold">Overall Performance</div>
                  <div className="text-2xl font-bold text-blue-600">{overallScore.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Above industry average</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collector Performance Rankings</CardTitle>
              <CardDescription>Individual performance scores and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectorRankings.map((collector, index) => (
                  <div key={collector.name} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                        index === 0 ? 'bg-gold-100 text-gold-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-lg">{collector.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {collector.members} members • Efficiency: {collector.efficiency}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(collector.collections)}</div>
                        <div className="text-sm text-muted-foreground">Collections</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{collector.satisfaction}/5.0</div>
                        <div className="text-sm text-muted-foreground">Rating</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className={`text-2xl font-bold ${
                          collector.score >= 95 ? 'text-green-600' :
                          collector.score >= 90 ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {collector.score}
                        </div>
                        <div className="text-sm text-muted-foreground">Score</div>
                      </div>
                      {index === 0 && (
                        <Award className="h-6 w-6 text-gold-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fund Efficiency Analysis</CardTitle>
              <CardDescription>Performance breakdown by chit fund</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fundEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fund" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="collections" fill="#3b82f6" name="Collections %" />
                    <Bar dataKey="payout" fill="#10b981" name="Payout %" />
                    <Bar dataKey="efficiency" fill="#f59e0b" name="Overall Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                {fundEfficiency.map((fund) => (
                  <div key={fund.fund} className="text-center p-3 rounded-lg border">
                    <div className="font-medium text-sm mb-2">{fund.fund}</div>
                    <div className={`text-xl font-bold ${
                      fund.efficiency >= 90 ? 'text-green-600' :
                      fund.efficiency >= 80 ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {fund.efficiency}%
                    </div>
                    <div className="text-xs text-muted-foreground">{fund.members} members</div>
                    <div className="text-xs text-muted-foreground">{fund.cycles} cycles</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
              <CardDescription>Performance metrics over the last 7 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="collections" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      name="Collections %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      name="Efficiency %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      name="Satisfaction %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {monthlyPerformance[monthlyPerformance.length - 1]?.collections}%
                  </div>
                  <div className="text-sm text-muted-foreground">Current Collections Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {monthlyPerformance[monthlyPerformance.length - 1]?.efficiency}%
                  </div>
                  <div className="text-sm text-muted-foreground">Current Efficiency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {monthlyPerformance[monthlyPerformance.length - 1]?.satisfaction}%
                  </div>
                  <div className="text-sm text-muted-foreground">Current Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Current risk levels across key categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskMetrics.map((risk) => (
                    <div key={risk.category} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          risk.status === 'low' ? 'bg-green-500' :
                          risk.status === 'medium' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium">{risk.category}</div>
                          <div className={`text-sm ${
                            risk.status === 'low' ? 'text-green-600' :
                            risk.status === 'medium' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {risk.status.toUpperCase()} RISK
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{risk.score}%</div>
                        <div className={`text-xs flex items-center ${
                          risk.trend > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {risk.trend > 0 ? 
                            <TrendingUp className="mr-1 h-3 w-3" /> : 
                            <TrendingDown className="mr-1 h-3 w-3" />
                          }
                          {Math.abs(risk.trend)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Summary</CardTitle>
                <CardDescription>Overall risk profile and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">LOW</div>
                    <div className="text-sm text-muted-foreground">Overall Risk Level</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {(riskMetrics.reduce((sum, risk) => sum + risk.score, 0) / riskMetrics.length).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <div className="text-sm">
                          <div className="font-medium text-green-800">Strong Risk Management</div>
                          <div className="text-green-700">Payment defaults and operational risks are well controlled.</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                        <div className="text-sm">
                          <div className="font-medium text-orange-800">Monitor Liquidity</div>
                          <div className="text-orange-700">Keep an eye on cash flow patterns and member withdrawals.</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <Target className="mr-2 h-4 w-4 text-blue-500" />
                        <div className="text-sm">
                          <div className="font-medium text-blue-800">Recommendations</div>
                          <div className="text-blue-700">Maintain current risk controls and review quarterly.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}