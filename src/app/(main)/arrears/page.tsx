import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ArrearsActions } from '@/components/arrears/arrears-actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle, TrendingDown, Users, DollarSign, Calendar } from 'lucide-react'

interface ArrearsData {
  member_id: string
  member_name: string
  phone: string
  chit_fund_id: string
  chit_fund_name: string
  arrears_amount: number
  advance_balance: number
  last_payment_date: string | null
  installment_per_member: number
  days_overdue: number
  overdue_cycles: number
}

export default async function ArrearsPage() {
  const supabase = createClient()

  // Get all members with their arrears information
  const { data: arrearsData, error } = await supabase
    .rpc('get_members_with_arrears')

  if (error) {
    console.error('Error fetching arrears data:', error)
  }

  // Calculate statistics
  const totalMembers = arrearsData?.length || 0
  const totalArrears = arrearsData?.reduce((sum: number, item: any) => 
    sum + parseFloat(item.arrears_amount || 0), 0) || 0
  
  // Group by severity (based on overdue cycles)
  const severeArrears = arrearsData?.filter((item: any) => 
    parseInt(item.overdue_cycles || 0) >= 2) || []
  const moderateArrears = arrearsData?.filter((item: any) => 
    parseInt(item.overdue_cycles || 0) === 1) || []
  const minorArrears = arrearsData?.filter((item: any) => 
    parseInt(item.overdue_cycles || 0) < 1 && parseFloat(item.arrears_amount || 0) > 0) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arrears Management</h1>
          <p className="text-muted-foreground">
            Track and manage overdue payments across all chit funds
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members with Arrears</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Members behind on payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arrears</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalArrears)}
            </div>
            <p className="text-xs text-muted-foreground">
              Outstanding payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Severe Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{severeArrears.length}</div>
            <p className="text-xs text-muted-foreground">
              2+ cycles behind
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Arrears</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMembers > 0 ? totalArrears / totalMembers : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per member in arrears
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Arrears by Severity */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({totalMembers})</TabsTrigger>
          <TabsTrigger value="severe">Severe ({severeArrears.length})</TabsTrigger>
          <TabsTrigger value="moderate">Moderate ({moderateArrears.length})</TabsTrigger>
          <TabsTrigger value="minor">Minor ({minorArrears.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ArrearsTable data={arrearsData || []} title="All Members with Arrears" />
        </TabsContent>

        <TabsContent value="severe">
          <ArrearsTable 
            data={severeArrears} 
            title="Severe Arrears (2+ Cycles Behind)"
            severity="severe"
          />
        </TabsContent>

        <TabsContent value="moderate">
          <ArrearsTable 
            data={moderateArrears} 
            title="Moderate Arrears (1 Cycle Behind)"
            severity="moderate"
          />
        </TabsContent>

        <TabsContent value="minor">
          <ArrearsTable 
            data={minorArrears} 
            title="Minor Arrears (Partial Payments)"
            severity="minor"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ArrearsTableProps {
  data: any[]
  title: string
  severity?: 'severe' | 'moderate' | 'minor'
}

function ArrearsTable({ data, title, severity }: ArrearsTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 text-lg font-medium">
              🎉 No members in this category!
            </div>
            <p className="text-muted-foreground mt-2">
              All members are current with their payments.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {severity === 'severe' && <AlertTriangle className="h-5 w-5 text-red-500" />}
          {severity === 'moderate' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
          {severity === 'minor' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
          <span>{title}</span>
        </CardTitle>
        <CardDescription>
          Members requiring attention for overdue payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Chit Fund</TableHead>
                <TableHead>Arrears Amount</TableHead>
                <TableHead>Overdue Cycles</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {data.map((item: any) => {
              const arrearsAmount = parseFloat(item.arrears_amount || 0)
              const installmentAmount = parseFloat(item.installment_per_member || 0)
              const overdueCycles = parseInt(item.overdue_cycles || 0)
              const daysOverdue = parseInt(item.days_overdue || 0)
              
              let severityBadge = 'outline'
              let severityText = 'Current'
              
              if (overdueCycles >= 2) {
                severityBadge = 'destructive'
                severityText = 'Severe'
              } else if (overdueCycles === 1) {
                severityBadge = 'secondary'
                severityText = 'Moderate'
              } else if (overdueCycles < 1 && arrearsAmount > 0) {
                severityBadge = 'outline'
                severityText = 'Minor'
              }

              const lastPaymentDate = item.last_payment_date ? new Date(item.last_payment_date) : null

              return (
                <TableRow key={`${item.member_id}-${item.chit_fund_id}`}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {item.member_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {item.chit_fund_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-red-600">
                        {formatCurrency(arrearsAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {installmentAmount > 0 ? `₹${installmentAmount}/cycle` : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-orange-600">
                        {overdueCycles}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {overdueCycles === 1 ? 'cycle behind' : 'cycles behind'}
                      </div>
                      <Progress 
                        value={Math.min(100, overdueCycles * 33)} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityBadge as any}>
                      {severityText}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lastPaymentDate ? (
                      <div className="space-y-1">
                        <div className="text-sm">
                          {formatDate(lastPaymentDate)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {daysOverdue} days ago
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No payments</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={daysOverdue > 60 ? 'destructive' : daysOverdue > 30 ? 'secondary' : 'outline'}
                    >
                      {daysOverdue} days
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ArrearsActions 
                      member={{ 
                        full_name: item.member_name, 
                        phone: item.phone, 
                        id: item.member_id 
                      }}
                      chitFund={{
                        name: item.chit_fund_name,
                        id: item.chit_fund_id,
                        installment_per_member: item.installment_per_member
                      }}
                      arrearsAmount={arrearsAmount}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}