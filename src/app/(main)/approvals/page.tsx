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
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Eye,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Calendar,
  Zap
} from 'lucide-react'
import { SYSTEM_PROFILE_ID } from '@/lib/system'

type ClosingSession = Tables<'closing_sessions'> & {
  profiles: {
    full_name: string | null
  }
  collection_entries?: {
    id: string
    amount_collected: number
    collection_date: string
    payment_method: string
    members: {
      full_name: string
    }
    chit_funds: {
      name: string
    }
    cycles: {
      cycle_number: number
    }
  }[]
}

interface ApprovalStats {
  pending_count: number
  perfect_match_count: number
  variance_count: number
  total_pending_amount: number
}

export default function ApprovalsPage() {
  const [closingSessions, setClosingSessions] = useState<ClosingSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ClosingSession[]>([])
  const [stats, setStats] = useState<ApprovalStats>({
    pending_count: 0,
    perfect_match_count: 0,
    variance_count: 0,
    total_pending_amount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [varianceFilter, setVarianceFilter] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<ClosingSession | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [closingSessions, searchTerm, varianceFilter])

  const fetchPendingApprovals = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('closing_sessions')
        .select(`
          *,
          profiles!collector_id (full_name),
          collection_entries (
            id,
            amount_collected,
            collection_date,
            payment_method,
            members (full_name),
            chit_funds (name),
            cycles (cycle_number)
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true })

      if (error) {
        console.error('Error fetching pending approvals:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load pending approvals."
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
      acc.pending_count++
      acc.total_pending_amount += session.declared_total
      
      const variance = session.declared_total - session.system_total
      if (variance === 0) {
        acc.perfect_match_count++
      } else {
        acc.variance_count++
      }
      
      return acc
    }, {
      pending_count: 0,
      perfect_match_count: 0,
      variance_count: 0,
      total_pending_amount: 0
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

    // Filter by variance
    if (varianceFilter !== 'all') {
      filtered = filtered.filter(session => {
        const variance = session.declared_total - session.system_total
        switch (varianceFilter) {
          case 'perfect':
            return variance === 0
          case 'variance':
            return variance !== 0
          case 'over':
            return variance > 0
          case 'under':
            return variance < 0
          default:
            return true
        }
      })
    }

    setFilteredSessions(filtered)
  }

  const openReviewModal = (session: ClosingSession, action: 'approve' | 'reject') => {
    setSelectedSession(session)
    setCurrentAction(action)
    setApprovalComment('')
    setShowReviewModal(true)
  }

  const handleApprovalAction = async () => {
    if (!selectedSession || !currentAction) return

    setActionLoading(true)
    try {
      const supabase = createClient()
      
      const updateData: any = {
        status: currentAction === 'approve' ? 'approved' : 'rejected',
        approved_by: SYSTEM_PROFILE_ID,
        approved_at: new Date().toISOString()
      }

      if (currentAction === 'reject') {
        updateData.rejection_reason = approvalComment
      }

      const { error } = await supabase
        .from('closing_sessions')
        .update(updateData)
        .eq('id', selectedSession.id)

      if (error) {
        console.error('Error processing approval:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to ${currentAction} closing session.`
        })
        return
      }

      // If approved, update collection entries status to 'closed'
      if (currentAction === 'approve') {
        const { error: collectionError } = await supabase
          .from('collection_entries')
          .update({ status: 'closed' })
          .eq('closing_session_id', selectedSession.id)

        if (collectionError) {
          console.error('Error updating collection entries:', collectionError)
          // Continue anyway, as the main approval was successful
        }

        try {
          // Recompute balances for all chit funds affected in this session
          const { data: entryFunds } = await supabase
            .from('collection_entries')
            .select('chit_fund_id')
            .eq('closing_session_id', selectedSession.id)
            .eq('status', 'closed')

          const uniqueFundIds = Array.from(new Set((entryFunds || []).map((e: any) => e.chit_fund_id)))
          for (const fundId of uniqueFundIds) {
            await supabase.rpc('update_all_member_balances', { p_chit_fund_id: fundId })
          }
        } catch (e) {
          console.warn('Balance recompute after approval encountered an issue:', e)
        }
      }

      toast({
        title: `Session ${currentAction}d successfully!`,
        description: `The closing session has been ${currentAction}d.`
      })

      setShowReviewModal(false)
      setSelectedSession(null)
      setCurrentAction(null)
      fetchPendingApprovals()
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    const perfectMatches = filteredSessions.filter(session => 
      session.declared_total === session.system_total
    )

    if (perfectMatches.length === 0) {
      toast({
        variant: "destructive",
        title: "No perfect matches",
        description: "There are no sessions with perfect variance to bulk approve."
      })
      return
    }

    setActionLoading(true)
    try {
      const supabase = createClient()
      
      // Bulk update closing sessions
      const { error } = await supabase
        .from('closing_sessions')
        .update({
          status: 'approved',
          approved_by: SYSTEM_PROFILE_ID,
          approved_at: new Date().toISOString()
        })
        .in('id', perfectMatches.map(s => s.id))

      if (error) {
        console.error('Error bulk approving sessions:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to bulk approve sessions."
        })
        return
      }

      // Update collection entries for all approved sessions
      for (const session of perfectMatches) {
        await supabase
          .from('collection_entries')
          .update({ status: 'closed' })
          .eq('closing_session_id', session.id)
      }

      toast({
        title: "Bulk approval successful!",
        description: `${perfectMatches.length} sessions with perfect matches have been approved.`
      })

      fetchPendingApprovals()
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setActionLoading(false)
    }
  }


  const getVarianceColor = (declared: number, system: number) => {
    const variance = declared - system
    if (variance === 0) return 'text-green-600'
    if (Math.abs(variance) <= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getVarianceBadgeVariant = (declared: number, system: number) => {
    const variance = declared - system
    if (variance === 0) return 'default'
    if (Math.abs(variance) <= 50) return 'secondary'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-gray-600">Review and approve submitted closing sessions</p>
        </div>
        {stats.perfect_match_count > 0 && (
          <Button 
            onClick={handleBulkApprove}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Bulk Approve Perfect Matches ({stats.perfect_match_count})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending_count}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Perfect Matches</p>
                <p className="text-2xl font-bold text-green-600">{stats.perfect_match_count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Variance</p>
                <p className="text-2xl font-bold text-amber-600">{stats.variance_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.total_pending_amount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
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
            <Select value={varianceFilter} onValueChange={setVarianceFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by variance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="perfect">Perfect Match (0 variance)</SelectItem>
                <SelectItem value="variance">With Variance</SelectItem>
                <SelectItem value="over">Over (positive variance)</SelectItem>
                <SelectItem value="under">Under (negative variance)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            {filteredSessions.length} of {closingSessions.length} sessions awaiting approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
              <p className="text-gray-600">
                {searchTerm || varianceFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'All closing sessions have been processed.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Session Date</TableHead>
                  <TableHead>Declared</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Collections</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const variance = session.declared_total - session.system_total
                  const daysPending = Math.floor(
                    (new Date().getTime() - new Date(session.submitted_at || '').getTime()) / (1000 * 60 * 60 * 24)
                  )
                  
                  return (
                    <TableRow key={session.id} className={daysPending > 2 ? 'bg-yellow-50' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {session.submitted_at 
                              ? new Date(session.submitted_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                          {daysPending > 2 && (
                            <Badge variant="outline" className="text-xs mt-1 w-fit">
                              {daysPending} days ago
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{session.profiles.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(session.session_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(session.declared_total)}</TableCell>
                      <TableCell>{formatCurrency(session.system_total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={getVarianceColor(session.declared_total, session.system_total)}>
                            {formatCurrency(variance)}
                          </span>
                          <Badge variant={getVarianceBadgeVariant(session.declared_total, session.system_total)}>
                            {variance === 0 ? 'Perfect' : variance > 0 ? 'Over' : 'Under'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.entries_count} items</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewModal(session, 'approve')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
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

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Closing Session</DialogTitle>
            <DialogDescription>
              Review the details and approve or reject this closing session
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Session Summary</span>
                    <Badge variant="secondary">
                      {new Date(selectedSession.session_date).toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Collector</p>
                      <p className="font-medium">{selectedSession.profiles.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Collections Count</p>
                      <p className="font-medium">{selectedSession.entries_count} items</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Declared Total</p>
                      <p className="font-medium">{formatCurrency(selectedSession.declared_total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">System Total</p>
                      <p className="font-medium">{formatCurrency(selectedSession.system_total)}</p>
                    </div>
                  </div>
                  
                  {/* Variance Analysis */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Variance Analysis:</span>
                      <div className="flex items-center space-x-2">
                        <span className={getVarianceColor(selectedSession.declared_total, selectedSession.system_total)}>
                          {formatCurrency(selectedSession.declared_total - selectedSession.system_total)}
                        </span>
                        <Badge variant={getVarianceBadgeVariant(selectedSession.declared_total, selectedSession.system_total)}>
                          {selectedSession.declared_total === selectedSession.system_total ? 'Perfect Match' : 
                           selectedSession.declared_total > selectedSession.system_total ? 'Overage' : 'Shortage'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedSession.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedSession.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Collection Details */}
              {selectedSession.collection_entries && selectedSession.collection_entries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Collection Details</CardTitle>
                    <CardDescription>
                      Individual collections included in this closing session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Fund</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Cycle</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSession.collection_entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {new Date(entry.collection_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{entry.chit_funds.name}</TableCell>
                            <TableCell>{entry.members.full_name}</TableCell>
                            <TableCell>#{entry.cycles.cycle_number}</TableCell>
                            <TableCell>{formatCurrency(entry.amount_collected)}</TableCell>
                            <TableCell>
                              <Badge variant={entry.payment_method === 'cash' ? 'default' : 'secondary'}>
                                {entry.payment_method}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Approval Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Action</CardTitle>
                  <CardDescription>
                    Add comments (optional for approval, required for rejection) and take action
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Comments</label>
                    <Textarea
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Enter approval comments or rejection reason..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewModal(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!approvalComment.trim()) {
                          toast({
                            variant: "destructive",
                            title: "Comment required",
                            description: "Please provide a reason for rejection."
                          })
                          return
                        }
                        setCurrentAction('reject')
                        handleApprovalAction()
                      }}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {actionLoading && currentAction === 'reject' ? 'Rejecting...' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentAction('approve')
                        handleApprovalAction()
                      }}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {actionLoading && currentAction === 'approve' ? 'Approving...' : 'Approve'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}