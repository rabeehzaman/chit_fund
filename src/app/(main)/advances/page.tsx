import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { AdvanceActions } from '@/components/advances/advance-actions'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, DollarSign, Calendar, CheckCircle } from 'lucide-react'

export default async function AdvancesPage() {
  const supabase = createClient()

  // Get all members with advance balances
  const { data: advancesData } = await supabase
    .rpc('get_members_with_advances')

  // Calculate statistics
  const totalMembers = advancesData?.length || 0
  const totalAdvances = advancesData?.reduce((sum: number, item: any) => 
    sum + parseFloat(item.advance_balance || 0), 0) || 0
  
  // Calculate total cycles that are prepaid
  const totalPrepaidCycles = advancesData?.reduce((sum: number, item: any) => 
    sum + (item.cycles_prepaid || 0), 0) || 0

  const averageAdvance = totalMembers > 0 ? totalAdvances / totalMembers : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advance Payments</h1>
          <p className="text-muted-foreground">
            Manage members with advance payment balances and auto-applications
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members with Advances</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Members with prepaid amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAdvances)}
            </div>
            <p className="text-xs text-muted-foreground">
              Prepaid by members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prepaid Cycles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPrepaidCycles}</div>
            <p className="text-xs text-muted-foreground">
              Future cycles covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Advance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageAdvance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per member with advances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Members with Advance Balances</span>
          </CardTitle>
          <CardDescription>
            Members who have paid in advance and their prepaid cycle coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {advancesData && advancesData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Chit Fund</TableHead>
                  <TableHead>Advance Balance</TableHead>
                  <TableHead>Cycles Prepaid</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advancesData.map((item: any) => {
                  const advanceBalance = parseFloat(item.advance_balance || 0)
                  const installmentAmount = parseFloat(item.installment_amount || 0)
                  const cyclesPrepaid = item.cycles_prepaid || 0
                  const partialPayment = advanceBalance % installmentAmount
                  const coveragePercentage = installmentAmount > 0 
                    ? Math.min(100, (partialPayment / installmentAmount) * 100)
                    : 0

                  return (
                    <TableRow key={`${item.member_id}-${item.chit_fund_id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.member_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.chit_fund_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-green-600">
                            {formatCurrency(advanceBalance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Installment: {formatCurrency(installmentAmount)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {cyclesPrepaid} cycles
                          </Badge>
                          {partialPayment > 0 && (
                            <div className="text-xs text-muted-foreground">
                              + {formatCurrency(partialPayment)} partial
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Progress value={coveragePercentage} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground">
                              {coveragePercentage.toFixed(0)}%
                            </span>
                          </div>
                          {cyclesPrepaid > 0 && (
                            <div className="text-xs font-medium text-green-600">
                              ✓ {cyclesPrepaid} future payment{cyclesPrepaid !== 1 ? 's' : ''} covered
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdvanceActions 
                          member={{
                            id: item.member_id,
                            full_name: item.member_name,
                            phone: item.phone
                          }}
                          chitFund={{
                            id: item.chit_fund_id,
                            name: item.chit_fund_name,
                            installment_amount: item.installment_amount
                          }}
                          advanceBalance={advanceBalance}
                          cyclesPrepaid={cyclesPrepaid}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                No members with advance payments found
              </div>
              <p className="text-sm text-muted-foreground">
                Members with excess payments will appear here for advance management
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Advances Work */}
      <Card>
        <CardHeader>
          <CardTitle>How Advance Payments Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-600">1. Excess Payment Detection</div>
              <p className="text-muted-foreground">
                When members pay more than the required installment amount, the excess is automatically detected and added to their advance balance.
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-green-600">2. Auto-Application</div>
              <p className="text-muted-foreground">
                Advance balances are automatically applied to future cycle payments, reducing the member&apos;s payment burden in upcoming months.
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-purple-600">3. Balance Tracking</div>
              <p className="text-muted-foreground">
                System maintains accurate advance balances and shows how many future cycles are covered by the prepaid amounts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}