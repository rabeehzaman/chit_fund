import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { CyclePaymentMatrix } from '@/components/cycles/cycle-payment-matrix'
import { WinnerSelectionDialog } from '@/components/cycles/winner-selection-dialog'
import { PayoutDialog } from '@/components/cycles/payout-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, Users, Trophy, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChitFundCyclesPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createClient()
  
  // Fetch chit fund details
  const { data: chitFund } = await supabase
    .from('chit_funds')
    .select('*')
    .eq('id', id)
    .single()

  if (!chitFund) {
    notFound()
  }

  // Fetch cycles with collection summaries
  const { data: cycles } = await supabase
    .from('cycles')
    .select(`
      *,
      winner_member:members(full_name),
      collection_entries(
        id,
        amount_collected,
        status,
        member_id,
        members(full_name)
      )
    `)
    .eq('chit_fund_id', id)
    .order('cycle_number', { ascending: true })

  // Fetch chit fund members
  const { data: members } = await supabase
    .from('chit_fund_members')
    .select(`
      *,
      member:members(
        id,
        full_name,
        phone
      )
    `)
    .eq('chit_fund_id', id)
    .eq('status', 'active')

  // Calculate cycle statistics
  const totalCycles = cycles?.length || 0
  const completedCycles = cycles?.filter(c => c.status === 'completed').length || 0
  const activeCycles = cycles?.filter(c => c.status === 'active').length || 0
  const upcomingCycles = cycles?.filter(c => c.status === 'upcoming').length || 0
  
  // Calculate overall collection progress
  const totalExpected = totalCycles * parseFloat(chitFund.installment_per_member) * (members?.length || 0)
  const totalCollected = cycles?.reduce((sum, cycle) => {
    return sum + (cycle.collection_entries || []).reduce((cycleSum: number, entry: any) => {
      return entry.status === 'closed' ? cycleSum + parseFloat(entry.amount_collected) : cycleSum
    }, 0)
  }, 0) || 0
  
  const overallProgress = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

  // Get current active cycle
  const currentCycle = cycles?.find(c => c.status === 'active') || cycles?.find(c => c.status === 'upcoming')

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{chitFund.name} - Cycles</h1>
          <p className="text-muted-foreground">
            Manage cycle progression and track member payments
          </p>
        </div>
        <div className="flex space-x-2">
          {currentCycle && currentCycle.status === 'active' && (
            <WinnerSelectionDialog 
              cycle={currentCycle} 
              chitFund={chitFund}
              members={members || []}
            >
              <Button>
                <Trophy className="mr-2 h-4 w-4" />
                Select Winner
              </Button>
            </WinnerSelectionDialog>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCycles}</div>
            <p className="text-xs text-muted-foreground">
              {chitFund.duration_months} months duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCycles}</div>
            <p className="text-xs text-muted-foreground">
              Cycles finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCycles}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingCycles}</div>
            <p className="text-xs text-muted-foreground">
              Not started yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalCollected)} of {formatCurrency(totalExpected)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Member × Cycle Payment Matrix</CardTitle>
          <CardDescription>
            Track payments across all cycles and members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CyclePaymentMatrix 
            chitFund={chitFund}
            cycles={cycles || []}
            members={members || []}
          />
        </CardContent>
      </Card>

      {/* Cycles Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Timeline</CardTitle>
          <CardDescription>
            View the progression of all cycles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycles && cycles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle: any) => {
                  const collectedAmount = (cycle.collection_entries || [])
                    .filter((entry: any) => entry.status === 'closed')
                    .reduce((sum: number, entry: any) => sum + parseFloat(entry.amount_collected), 0)
                  
                  const expectedAmount = parseFloat(chitFund.installment_per_member) * (members?.length || 0)
                  const collectionPercentage = expectedAmount > 0 ? (collectedAmount / expectedAmount) * 100 : 0
                  
                  return (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        Cycle {cycle.cycle_number}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(cycle.cycle_date))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cycle.status === 'completed'
                              ? 'default'
                              : cycle.status === 'active'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {cycle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {formatCurrency(collectedAmount)} / {formatCurrency(expectedAmount)}
                          </div>
                          <Progress value={collectionPercentage} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {collectionPercentage.toFixed(1)}% collected
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cycle.winner_member ? (
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {cycle.winner_member.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not selected</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cycle.payout_amount ? (
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(parseFloat(cycle.payout_amount))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {cycle.status === 'active' && !cycle.winner_member_id && (
                            <WinnerSelectionDialog 
                              cycle={cycle} 
                              chitFund={chitFund}
                              members={members || []}
                            >
                              <Button variant="outline" size="sm">
                                Select Winner
                              </Button>
                            </WinnerSelectionDialog>
                          )}
                          {cycle.winner_member_id && !cycle.payout_amount && (
                            <PayoutDialog 
                              cycle={cycle} 
                              chitFund={chitFund}
                              winner={cycle.winner_member}
                            >
                              <Button variant="outline" size="sm">
                                Process Payout
                              </Button>
                            </PayoutDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">
                No cycles found for this chit fund
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}