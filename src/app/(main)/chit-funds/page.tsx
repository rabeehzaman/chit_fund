import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateChitFundDialog } from '@/components/chit-funds/create-chit-fund-dialog'
import { ViewChitFundDialog } from '@/components/chit-funds/view-chit-fund-dialog'
import { EditChitFundDialog } from '@/components/chit-funds/edit-chit-fund-dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'

// Disable caching to ensure fresh data
export const revalidate = 0

export default async function ChitFundsPage() {
  // Fetch real data from Supabase (authentication removed, RLS disabled)
  const supabase = createClient()

  // Fetch chit funds with member counts
  const { data: chitFunds } = await supabase
    .from('chit_funds')
    .select(`
      *,
      chit_fund_members(count)
    `)
    .order('created_at', { ascending: false })

  // Calculate stats
  const totalFunds = chitFunds?.length || 0
  const activeFunds = chitFunds?.filter(fund => fund.status === 'active').length || 0
  const totalValue = chitFunds?.reduce((sum, fund) => sum + parseFloat(fund.total_amount || '0'), 0) || 0

  // Fetch total members count
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })

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
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">All funds combined</p>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chitFunds.map((fund: any) => (
                      <TableRow key={fund.id}>
                        <TableCell className="font-medium">{fund.name}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(fund.total_amount))}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(fund.installment_amount))}</TableCell>
                        <TableCell>{fund.duration_months} months</TableCell>
                        <TableCell>{fund.chit_fund_members?.length || 0}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
