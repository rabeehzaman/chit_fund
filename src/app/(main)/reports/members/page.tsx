'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Search
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts'

// Mock data for member reports
const memberSegments = [
  { segment: 'Regular Payers', count: 145, percentage: 85, color: '#10b981' },
  { segment: 'Occasional Delays', count: 18, percentage: 11, color: '#f59e0b' },
  { segment: 'Chronic Defaulters', count: 7, percentage: 4, color: '#ef4444' }
]

const paymentBehavior = [
  { month: 'Feb', onTime: 142, late: 15, missed: 3 },
  { month: 'Mar', onTime: 148, late: 12, missed: 2 },
  { month: 'Apr', onTime: 151, late: 9, missed: 2 },
  { month: 'May', onTime: 145, late: 13, missed: 4 },
  { month: 'Jun', onTime: 158, late: 8, missed: 1 },
  { month: 'Jul', onTime: 163, late: 6, missed: 1 },
  { month: 'Aug', onTime: 165, late: 4, missed: 1 },
]

const topMembers = [
  { name: 'Rajesh Kumar', totalPaid: 45000, onTimePayments: 12, funds: 2, lastPayment: '2024-08-15', status: 'excellent' },
  { name: 'Priya Singh', totalPaid: 38000, onTimePayments: 11, funds: 2, lastPayment: '2024-08-14', status: 'excellent' },
  { name: 'Amit Sharma', totalPaid: 42000, onTimePayments: 10, funds: 3, lastPayment: '2024-08-13', status: 'good' },
  { name: 'Meera Patel', totalPaid: 35000, onTimePayments: 11, funds: 1, lastPayment: '2024-08-12', status: 'excellent' },
  { name: 'Suresh Reddy', totalPaid: 29000, onTimePayments: 9, funds: 2, lastPayment: '2024-08-11', status: 'good' },
]

const defaulters = [
  { name: 'Vikram Singh', overdue: 15000, daysPending: 15, fund: 'Premium Fund', phone: '+91 98765 43210', severity: 'high' },
  { name: 'Anita Das', overdue: 8000, daysPending: 8, fund: 'Standard Fund', phone: '+91 98765 43211', severity: 'medium' },
  { name: 'Ravi Kumar', overdue: 12000, daysPending: 22, fund: 'Gold Fund', phone: '+91 98765 43212', severity: 'high' },
  { name: 'Sunita Rao', overdue: 5000, daysPending: 5, fund: 'Bronze Fund', phone: '+91 98765 43213', severity: 'low' },
]

const memberGrowth = [
  { month: 'Jan', newMembers: 12, totalMembers: 145 },
  { month: 'Feb', newMembers: 8, totalMembers: 153 },
  { month: 'Mar', newMembers: 15, totalMembers: 168 },
  { month: 'Apr', newMembers: 11, totalMembers: 179 },
  { month: 'May', newMembers: 9, totalMembers: 188 },
  { month: 'Jun', newMembers: 13, totalMembers: 201 },
  { month: 'Jul', newMembers: 7, totalMembers: 208 },
]

export default function MemberReportsPage() {
  const totalMembers = memberSegments.reduce((sum, segment) => sum + segment.count, 0)
  const regularPayers = memberSegments.find(s => s.segment === 'Regular Payers')?.count || 0
  const defaulterCount = memberSegments.find(s => s.segment === 'Chronic Defaulters')?.count || 0
  const complianceRate = ((regularPayers / totalMembers) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive member analytics and behavior insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select fund" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funds</SelectItem>
              <SelectItem value="premium">Premium Fund</SelectItem>
              <SelectItem value="gold">Gold Fund</SelectItem>
              <SelectItem value="standard">Standard Fund</SelectItem>
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
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +6.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Compliance</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complianceRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +2.1% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Defaulters</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{defaulterCount}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -18% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memberGrowth[memberGrowth.length - 1]?.newMembers || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">Payment Behavior</TabsTrigger>
          <TabsTrigger value="performance">Top Performers</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Member Segments</CardTitle>
                <CardDescription>Classification by payment behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memberSegments.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <div className="font-medium">{segment.segment}</div>
                          <div className="text-sm text-muted-foreground">{segment.count} members</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{segment.percentage}%</div>
                        <Progress value={segment.percentage} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{complianceRate}%</div>
                    <div className="text-sm text-muted-foreground">Overall Compliance Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Member Distribution</CardTitle>
                <CardDescription>Visual breakdown of member segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={memberSegments}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {memberSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [
                        `${value} members (${props.payload.percentage}%)`,
                        props.payload.segment
                      ]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payment Behavior</CardTitle>
              <CardDescription>Payment patterns over the last 7 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentBehavior}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="onTime" fill="#10b981" name="On Time" />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" />
                    <Bar dataKey="missed" fill="#ef4444" name="Missed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {paymentBehavior[paymentBehavior.length - 1]?.onTime || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">On Time This Month</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {paymentBehavior[paymentBehavior.length - 1]?.late || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Late This Month</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {paymentBehavior[paymentBehavior.length - 1]?.missed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Missed This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Members</CardTitle>
              <CardDescription>Members with excellent payment records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>On-Time Payments</TableHead>
                    <TableHead>Active Funds</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMembers.map((member) => (
                    <TableRow key={member.name}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{formatCurrency(member.totalPaid)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          {member.onTimePayments}/12
                        </div>
                      </TableCell>
                      <TableCell>{member.funds}</TableCell>
                      <TableCell>{new Date(member.lastPayment).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            member.status === 'excellent' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaulters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Defaulters</CardTitle>
              <CardDescription>Members with overdue payments requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Overdue Amount</TableHead>
                    <TableHead>Days Pending</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((defaulter) => (
                    <TableRow key={defaulter.name}>
                      <TableCell className="font-medium">{defaulter.name}</TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatCurrency(defaulter.overdue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                          {defaulter.daysPending} days
                        </div>
                      </TableCell>
                      <TableCell>{defaulter.fund}</TableCell>
                      <TableCell className="text-sm">{defaulter.phone}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            defaulter.severity === 'high' 
                              ? 'bg-red-100 text-red-800 hover:bg-red-100'
                              : defaulter.severity === 'medium'
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }
                        >
                          {defaulter.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">Call</Button>
                          <Button variant="outline" size="sm">SMS</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium text-orange-800">Follow-up Required</div>
                    <div className="text-sm text-orange-700">
                      {defaulters.filter(d => d.severity === 'high').length} high-priority defaulters need immediate attention.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Growth Trends</CardTitle>
              <CardDescription>Member acquisition and total membership over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="totalMembers" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      name="Total Members"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newMembers" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      name="New Members"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{memberGrowth[memberGrowth.length - 1]?.totalMembers}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {memberGrowth.reduce((sum, month) => sum + month.newMembers, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">New Members (7 months)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {(memberGrowth.reduce((sum, month) => sum + month.newMembers, 0) / memberGrowth.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Monthly Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}