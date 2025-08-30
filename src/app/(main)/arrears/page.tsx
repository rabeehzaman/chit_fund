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
  days_overdue: number
  last_payment_date: string | null
  expected_payments: number
  actual_payments: number
  installment_amount: number
}

export default async function ArrearsPage() {
  const supabase = createClient()

  // Get all members with their arrears information
  const { data: arrearsData } = await supabase
    .rpc('get_members_with_arrears')
    .then(response => {
      // If the function doesn't exist yet, create a mock query
      if (response.error) {
        return supabase
          .from('member_balances')
          .select(`
            member_id,
            chit_fund_id,
            arrears_amount,
            last_payment_date,
            members!inner(
              full_name,
              phone
            ),
            chit_funds!inner(
              name,
              installment_amount,
              start_date
            )
          `)
          .gt('arrears_amount', 0)
          .order('arrears_amount', { ascending: false })
      }
      return response
    })

  // Calculate statistics
  const totalMembers = arrearsData?.length || 0
  const totalArrears = arrearsData?.reduce((sum: number, item: any) => 
    sum + parseFloat(item.arrears_amount || 0), 0) || 0
  
  // Group by severity
  const severeArrears = arrearsData?.filter((item: any) => 
    parseFloat(item.arrears_amount || 0) >= parseFloat(item.chit_funds?.installment_amount || 0) * 2) || []
  const moderateArrears = arrearsData?.filter((item: any) => {
    const amount = parseFloat(item.arrears_amount || 0)
    const installment = parseFloat(item.chit_funds?.installment_amount || 0)
    return amount >= installment && amount < installment * 2
  }) || []
  const minorArrears = arrearsData?.filter((item: any) => 
    parseFloat(item.arrears_amount || 0) < parseFloat(item.chit_funds?.installment_amount || 0)) || []

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
              2+ installments behind
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
            title="Severe Arrears (2+ Installments Behind)"
            severity="severe"
          />
        </TabsContent>

        <TabsContent value="moderate">
          <ArrearsTable 
            data={moderateArrears} 
            title="Moderate Arrears (1-2 Installments Behind)"
            severity="moderate"
          />
        </TabsContent>

        <TabsContent value="minor">
          <ArrearsTable 
            data={minorArrears} 
            title="Minor Arrears (<1 Installment Behind)"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Chit Fund</TableHead>
              <TableHead>Arrears Amount</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => {
              const arrearsAmount = parseFloat(item.arrears_amount || 0)
              const installmentAmount = parseFloat(item.chit_funds?.installment_amount || item.installment_amount || 0)
              const installmentsBehind = installmentAmount > 0 ? arrearsAmount / installmentAmount : 0
              
              let severityBadge = 'outline'
              let severityText = 'Current'
              
              if (installmentsBehind >= 2) {
                severityBadge = 'destructive'
                severityText = 'Severe'
              } else if (installmentsBehind >= 1) {
                severityBadge = 'secondary'
                severityText = 'Moderate'
              } else if (installmentsBehind > 0) {
                severityBadge = 'outline'
                severityText = 'Minor'
              }

              // Calculate days overdue (mock calculation for now)
              const lastPaymentDate = item.last_payment_date ? new Date(item.last_payment_date) : null
              const daysOverdue = lastPaymentDate 
                ? Math.floor((Date.now() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0

              return (
                <TableRow key={`${item.member_id}-${item.chit_fund_id}`}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {item.members?.full_name || item.member_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.members?.phone || item.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {item.chit_funds?.name || item.chit_fund_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-red-600">
                        {formatCurrency(arrearsAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {installmentsBehind.toFixed(1)} installments behind
                      </div>
                      <Progress 
                        value={Math.min(100, installmentsBehind * 50)} 
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
                      member={item.members || { 
                        full_name: item.member_name, 
                        phone: item.phone, 
                        id: item.member_id 
                      }}
                      chitFund={item.chit_funds || {
                        name: item.chit_fund_name,
                        id: item.chit_fund_id,
                        installment_amount: item.installment_amount
                      }}
                      arrearsAmount={arrearsAmount}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}