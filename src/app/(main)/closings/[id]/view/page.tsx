'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
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
  collection_entries: {
    id: string
    amount_collected: number
    collection_date: string
    collection_time: string | null
    payment_method: string
    notes: string | null
    members: {
      full_name: string
      phone: string | null
    }
    chit_funds: {
      name: string
      installment_amount: number
    }
    cycles: {
      cycle_number: number
      cycle_date: string
    }
  }[]
}

export default function ViewClosingSessionPage() {
  const params = useParams()
  const sessionId = params.id as string
  const [session, setSession] = useState<ClosingSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchClosingSession()
    }
  }, [sessionId])

  const fetchClosingSession = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('closing_sessions')
        .select(`
          *,
          profiles!collector_id (full_name),
          approved_by_profile:profiles!approved_by (full_name),
          collection_entries (
            id,
            amount_collected,
            collection_date,
            collection_time,
            payment_method,
            notes,
            members (full_name, phone),
            chit_funds (name, installment_amount),
            cycles (cycle_number, cycle_date)
          )
        `)
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching closing session:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load closing session."
        })
        return
      }

      setSession(data)
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setLoading(false)
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
          <p className="mt-2 text-gray-600">Loading closing session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Closing Session Not Found</h3>
        <p className="text-gray-600 mb-4">
          The closing session you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Link href="/closings">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Closings
          </Button>
        </Link>
      </div>
    )
  }

  const variance = session.declared_total - session.system_total

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/closings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Closing Session Details</h1>
            <p className="text-gray-600">
              Session from {new Date(session.session_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(session.status)}
          {session.status === 'draft' && (
            <Link href={`/closings/${session.id}/edit`}>
              <Button>
                Edit Session
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Collector</p>
                      <p className="font-medium">{session.profiles.full_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Session Date</p>
                      <p className="font-medium">{new Date(session.session_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Collections Count</p>
                      <p className="font-medium">{session.entries_count} items</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(session.created_at).toLocaleDateString()} at{' '}
                      {new Date(session.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {session.submitted_at && (
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-medium">
                        {new Date(session.submitted_at).toLocaleDateString()} at{' '}
                        {new Date(session.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                  )}

                  {session.approved_at && (
                    <div>
                      <p className="text-sm text-gray-600">
                        {session.status === 'approved' ? 'Approved' : 'Rejected'}
                      </p>
                      <p className="font-medium">
                        {new Date(session.approved_at).toLocaleDateString()} at{' '}
                        {new Date(session.approved_at).toLocaleTimeString()}
                      </p>
                      {session.approved_by_profile?.full_name && (
                        <p className="text-sm text-gray-500">
                          by {session.approved_by_profile.full_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {session.notes && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{session.notes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {session.status === 'rejected' && session.rejection_reason && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm text-red-600 mb-2">Rejection Reason</p>
                  <p className="text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    {session.rejection_reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collection Details */}
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
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.collection_entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {new Date(entry.collection_date).toLocaleDateString()}
                          </span>
                          {entry.collection_time && (
                            <span className="text-xs text-gray-500">
                              {entry.collection_time}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{entry.chit_funds.name}</span>
                          <span className="text-xs text-gray-500">
                            Installment: {formatCurrency(entry.chit_funds.installment_amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{entry.members.full_name}</span>
                          {entry.members.phone && (
                            <span className="text-xs text-gray-500">{entry.members.phone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">#{entry.cycles.cycle_number}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.cycles.cycle_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(entry.amount_collected)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.payment_method === 'cash' ? 'default' : 'secondary'}>
                          {entry.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.notes ? (
                          <span className="text-sm text-gray-600">{entry.notes}</span>
                        ) : (
                          <span className="text-xs text-gray-400">No notes</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Declared Total:</span>
                <span className="font-medium">{formatCurrency(session.declared_total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Total:</span>
                <span className="font-medium">{formatCurrency(session.system_total)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Variance:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${getVarianceColor(session.declared_total, session.system_total)}`}>
                      {formatCurrency(variance)}
                    </span>
                    <Badge variant={getVarianceBadgeVariant(session.declared_total, session.system_total)}>
                      {variance === 0 ? 'Perfect' : variance > 0 ? 'Over' : 'Under'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variance Alert */}
          {Math.abs(variance) > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-800">
                      Variance Detected
                    </h4>
                    <p className="text-xs text-amber-700">
                      {variance > 0 
                        ? `Declared amount is ${formatCurrency(Math.abs(variance))} more than system total.`
                        : `Declared amount is ${formatCurrency(Math.abs(variance))} less than system total.`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status:</span>
                {getStatusBadge(session.status)}
              </div>
              
              {session.status === 'draft' && (
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  <Clock className="h-3 w-3 inline mr-1" />
                  This session can still be edited or submitted for approval.
                </div>
              )}
              
              {session.status === 'submitted' && (
                <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                  <Send className="h-3 w-3 inline mr-1" />
                  This session is awaiting admin approval and cannot be modified.
                </div>
              )}
              
              {session.status === 'approved' && (
                <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  This session has been approved and all collections have been posted.
                </div>
              )}
              
              {session.status === 'rejected' && (
                <div className="text-xs text-gray-500 bg-red-50 p-2 rounded">
                  <XCircle className="h-3 w-3 inline mr-1" />
                  This session was rejected. Collections have been reset to pending status.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}