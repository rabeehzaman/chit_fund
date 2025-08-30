import { createClient } from '@/lib/supabase/server'
// Auth removed; no redirects
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AddMemberDialog } from '@/components/members/add-member-dialog'
import { EditMemberDialog } from '@/components/members/edit-member-dialog'
import { AssignCollectorDialog } from '@/components/members/assign-collector-dialog'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'

export default async function MembersPage() {
  // Fetch real data from Supabase (authentication removed, RLS disabled)
  const supabase = createClient()

  // Fetch members data with assignments
  const { data: members } = await supabase
    .from('members')
    .select(`
      *,
      chit_fund_members(
        chit_fund_id,
        assigned_collector_id,
        chit_funds(id, name),
        assigned_collector:profiles(id, full_name)
      )
    `)
    .order('created_at', { ascending: false })

  const { data: chitFunds } = await supabase
    .from('chit_funds')
    .select('*')

  const { data: collectors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'collector')

  const mockProfile = {
    role: 'admin',
    full_name: 'System Administrator'
  }

  // Calculate assignment statistics
  const assignedMembers = members?.filter(m => m.chit_fund_members && m.chit_fund_members.length > 0) || []
  const unassignedMembers = members?.filter(m => !m.chit_fund_members || m.chit_fund_members.length === 0) || []

  return (
    <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members?.length || 0}</div>
                <p className="text-xs text-muted-foreground">All members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Members</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedMembers.length}</div>
                <p className="text-xs text-muted-foreground">In chit funds</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unassignedMembers.length}</div>
                <p className="text-xs text-muted-foreground">Not in any fund</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chit Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chitFunds?.filter(f => f.status === 'active').length || 0}</div>
                <p className="text-xs text-muted-foreground">Available funds</p>
              </CardContent>
            </Card>
          </div>

          {/* Members Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    Manage chit fund members and their assignments
                  </CardDescription>
                </div>
                <AddMemberDialog chitFunds={chitFunds || []} collectors={collectors || []}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </AddMemberDialog>
              </div>
            </CardHeader>
            <CardContent>
              {members && members.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Chit Funds</TableHead>
                      <TableHead>Assigned Collector</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.phone || 'Not provided'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.chit_fund_members?.length > 0 ? (
                              member.chit_fund_members.map((cfm: any) => (
                                <Badge key={cfm.chit_funds.id} variant="outline">
                                  {cfm.chit_funds.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.chit_fund_members?.length > 0 && member.chit_fund_members[0].assigned_collector ? (
                            <Badge variant="secondary">
                              {member.chit_fund_members[0].assigned_collector.full_name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <EditMemberDialog member={member}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </EditMemberDialog>
                            <AssignCollectorDialog
                              member={member}
                              collectors={collectors || []}
                              chitFunds={chitFunds || []}
                            >
                              <Button variant="outline" size="sm">
                                Assign
                              </Button>
                            </AssignCollectorDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-gray-500 mb-4">
                    No members added yet
                  </div>
                  <AddMemberDialog chitFunds={chitFunds || []} collectors={collectors || []}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Member
                    </Button>
                  </AddMemberDialog>
                </div>
              )}
            </CardContent>
          </Card>
    </>
  )
}
