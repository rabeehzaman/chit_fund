import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddUserDialog } from '@/components/users/add-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { ToggleUserStatusButton } from '@/components/users/toggle-user-status-button'

export default async function UsersManagementPage() {
  const supabase = createClient()
  
  // Fetch all users from profiles table
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  return (
    <>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Users</h2>
            <p className="text-gray-600">Manage administrators and collectors</p>
          </div>
          <AddUserDialog />
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              List of all administrators and collectors in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {user.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role || 'member'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.phone || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <EditUserDialog user={user}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </EditUserDialog>
                            <ToggleUserStatusButton user={user} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No users found in the system.</p>
                <AddUserDialog />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {users?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {users?.filter(u => u.role === 'admin').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Collectors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {users?.filter(u => u.role === 'collector').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}
