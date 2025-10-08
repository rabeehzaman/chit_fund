import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedTable, AnimatedTableBody, AnimatedTableCell, AnimatedTableHeader, AnimatedTableRow, TableHead } from '@/components/ui/animated-table'
import { CreateChitFundDialog } from '@/components/chit-funds/create-chit-fund-dialog'
import { ViewChitFundDialog } from '@/components/chit-funds/view-chit-fund-dialog'
import { EditChitFundDialog } from '@/components/chit-funds/edit-chit-fund-dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function ChitFundsPage() {
  // Fetch real data from Supabase (authentication removed, RLS disabled)
  const supabase = await createClient()

  // Fetch chit funds with dynamic calculations
  const { data: chitFunds } = await supabase
    .rpc('get_all_chit_funds_with_stats')
  
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })

  // Calculate stats using dynamic values
  const totalFunds = chitFunds?.length || 0
  const activeFunds = chitFunds?.filter((fund: any) => fund.status === 'active').length || 0
  const totalDynamicValue = chitFunds?.reduce((sum: number, fund: any) => sum + parseFloat(fund.current_fund_value || '0'), 0) || 0

  const mockProfile = {
    role: 'admin',
    full_name: 'System Administrator'
  }

  return (
    <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Chit Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFunds}</div>
                <p className="text-xs text-muted-foreground">All chit funds</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeFunds}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground">Across all funds</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalDynamicValue)}</div>
                <p className="text-xs text-muted-foreground">Current dynamic value</p>
              </CardContent>
            </Card>
          </div>

          {/* Chit Funds Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chit Funds</CardTitle>
                  <CardDescription>
                    Manage your chit funds and members
                  </CardDescription>
                </div>
                {mockProfile.role === 'admin' && (
                  <CreateChitFundDialog>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Chit Fund
                    </Button>
                  </CreateChitFundDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {chitFunds && chitFunds.length > 0 ? (
                <AnimatedTable>
                  <AnimatedTableHeader>
                    <AnimatedTableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Current Fund Value</TableHead>
                      <TableHead>Per Member</TableHead>
                      <TableHead>Duration / Cycles</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </AnimatedTableRow>
                  </AnimatedTableHeader>
                  <AnimatedTableBody>
                    {chitFunds.map((fund: any) => (
                      <AnimatedTableRow key={fund.id} interactive>
                        <AnimatedTableCell className="font-medium">{fund.name}</AnimatedTableCell>
                        <AnimatedTableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{formatCurrency(parseFloat(fund.current_fund_value || '0'))}</div>
                            <div className="text-xs text-muted-foreground">
                              {fund.current_members} members
                            </div>
                          </div>
                        </AnimatedTableCell>
                        <AnimatedTableCell>{formatCurrency(parseFloat(fund.installment_per_member))}</AnimatedTableCell>
                        <AnimatedTableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{fund.duration_months} months</div>
                            <div className="text-xs text-muted-foreground">
                              {fund.total_cycles} cycles (= members)
                            </div>
                          </div>
                        </AnimatedTableCell>
                        <AnimatedTableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {fund.current_members} members
                            </div>
                            <div className="text-xs text-muted-foreground">
                              No limit - growing fund
                            </div>
                          </div>
                        </AnimatedTableCell>
                        <AnimatedTableCell>
                          <Badge
                            variant={
                              fund.status === 'active'
                                ? 'default'
                                : fund.status === 'completed'
                                ? 'secondary'
                                : fund.status === 'planning'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {fund.status}
                          </Badge>
                        </AnimatedTableCell>
                        <AnimatedTableCell>
                          <div className="flex space-x-2">
                            <ViewChitFundDialog chitFund={fund}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </ViewChitFundDialog>
                            <EditChitFundDialog chitFund={fund}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </EditChitFundDialog>
                            <Link href={`/chit-funds/${fund.id}/cycles`}>
                              <Button variant="outline" size="sm">
                                Cycles
                              </Button>
                            </Link>
                          </div>
                        </AnimatedTableCell>
                      </AnimatedTableRow>
                    ))}
                  </AnimatedTableBody>
                </AnimatedTable>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    No chit funds created yet
                  </div>
                  {mockProfile.role === 'admin' && (
                    <CreateChitFundDialog>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Chit Fund
                      </Button>
                    </CreateChitFundDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
    </>
  )
}
