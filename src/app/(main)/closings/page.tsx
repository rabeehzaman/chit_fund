'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Trash2, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

type ClosingSession = Tables<'closing_sessions'> & {
  profiles: {
    full_name: string | null
  }
  approved_by_profile?: {
    full_name: string | null
  } | null
}

interface ClosingSessionStats {
  total_count: number
  draft_count: number
  submitted_count: number
  approved_count: number
  rejected_count: number
}

export default function ClosingsPage() {
  const [closingSessions, setClosingSessions] = useState<ClosingSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ClosingSession[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState<ClosingSessionStats>({
    total_count: 0,
    draft_count: 0,
    submitted_count: 0,
    approved_count: 0,
    rejected_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<ClosingSession | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchClosingSessions()
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single()

        setCurrentUser(profile)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    filterSessions()
  }, [closingSessions, searchTerm, statusFilter])

  const fetchClosingSessions = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('closing_sessions')
        .select(`
          *,
          profiles!collector_id (full_name),
          approved_by_profile:profiles!approved_by (full_name)
        `)

      // Filter by collector ID if user is a collector
      if (currentUser?.role === 'collector') {
        query = query.eq('collector_id', currentUser.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching closing sessions:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load closing sessions."
        })
        return
      }

      setClosingSessions(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (sessions: ClosingSession[]) => {
    const stats = sessions.reduce((acc, session) => {
      acc.total_count++
      switch (session.status) {
        case 'draft':
          acc.draft_count++
          break
        case 'submitted':
          acc.submitted_count++
          break
        case 'approved':
          acc.approved_count++
          break
        case 'rejected':
          acc.rejected_count++
          break
      }
      return acc
    }, {
      total_count: 0,
      draft_count: 0,
      submitted_count: 0,
      approved_count: 0,
      rejected_count: 0
    })

    setStats(stats)
  }

  const filterSessions = () => {
    let filtered = closingSessions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    setFilteredSessions(filtered)
  }

  const handleSubmitSession = async (sessionId: string) => {
    setActionLoading(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('closing_sessions')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error submitting session:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit closing session."
        })
        return
      }

      toast({
        title: "Session submitted successfully!",
        description: "The closing session has been submitted for approval."
      })

      fetchClosingSessions()
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!selectedSession) return

    setActionLoading(true)
    try {
      const supabase = createClient()
      
      // First, remove the closing session ID from collection entries
      await supabase
        .from('collection_entries')
        .update({ closing_session_id: null })
        .eq('closing_session_id', selectedSession.id)

      // Then delete the closing session
      const { error } = await supabase
        .from('closing_sessions')
        .delete()
        .eq('id', selectedSession.id)

      if (error) {
        console.error('Error deleting session:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete closing session."
        })
        return
      }

      toast({
        title: "Session deleted successfully!",
        description: "The closing session and associated collection links have been removed."
      })

      setShowDeleteDialog(false)
      setSelectedSession(null)
      fetchClosingSessions()
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setActionLoading(false)
    }
  }


  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
      case 'submitted':
        return <Badge variant="secondary"><Send className="h-3 w-3 mr-1" />Submitted</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getVarianceColor = (declared: number, system: number) => {
    const variance = declared - system
    if (variance === 0) return 'text-green-600'
    if (Math.abs(variance) <= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const canEdit = (session: ClosingSession) => session.status === 'draft'
  const canSubmit = (session: ClosingSession) => session.status === 'draft'
  const canDelete = (session: ClosingSession) => session.status === 'draft'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading closing sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Closing Sessions</h1>
          <p className="text-gray-600">View and manage all closing sessions</p>
        </div>
        <Link href="/closings/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Closing Session
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.total_count}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft_count}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.submitted_count}</p>
              </div>
              <Send className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected_count}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by collector name or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Closing Sessions</CardTitle>
          <CardDescription>
            {filteredSessions.length} of {closingSessions.length} sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No closing sessions found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Create your first closing session to get started.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Link href="/closings/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Closing Session
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {currentUser?.role === 'admin' && <TableHead>Collector</TableHead>}
                  <TableHead>Declared</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Collections</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const variance = session.declared_total - session.system_total
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        {new Date(session.session_date).toLocaleDateString()}
                      </TableCell>
                      {currentUser?.role === 'admin' && <TableCell>{session.profiles.full_name}</TableCell>}
                      <TableCell>{formatCurrency(session.declared_total)}</TableCell>
                      <TableCell>{formatCurrency(session.system_total)}</TableCell>
                      <TableCell>
                        <span className={getVarianceColor(session.declared_total, session.system_total)}>
                          {formatCurrency(variance)}
                        </span>
                        {Math.abs(variance) > 0 && (
                          <AlertTriangle className="h-4 w-4 inline ml-1 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.entries_count} items</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {canEdit(session) && (
                            <Link href={`/closings/${session.id}/edit`}>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          
                          <Link href={`/closings/${session.id}/view`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                          
                          {canSubmit(session) && (
                            <Button
                              size="sm"
                              onClick={() => handleSubmitSession(session.id)}
                              disabled={actionLoading}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}

                          {canDelete(session) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Closing Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this closing session? This action cannot be undone.
              The associated collection entries will be reset to &quot;pending close&quot; status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}