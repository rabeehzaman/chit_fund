'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Trophy, Users, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Member {
  member: {
    id: string
    full_name: string
    phone?: string
  }
}

interface Cycle {
  id: string
  cycle_number: number
  cycle_date: string
  status: string
  collection_entries?: any[]
}

interface ChitFund {
  id: string
  name: string
  installment_per_member: string
  duration_months: number
}

interface WinnerSelectionDialogProps {
  cycle: Cycle
  chitFund: ChitFund
  members: Member[]
  children: React.ReactNode
}

interface EligibleMember {
  member_id: string
  member_name: string
  phone?: string
  current_balance_status: 'ADVANCE' | 'ARREARS' | 'CURRENT'
  advance_balance: number
  arrears_amount: number
}

export function WinnerSelectionDialog({ 
  cycle, 
  chitFund, 
  members, 
  children 
}: WinnerSelectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('')
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open) {
      await fetchEligibleMembers()
    }
  }

  const fetchEligibleMembers = async () => {
    setIsLoading(true)
    try {
      // Use the helper function to get eligible winners
      const { data, error } = await supabase
        .rpc('get_eligible_winners', { p_chit_fund_id: chitFund.id })

      if (error) throw error

      setEligibleMembers(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      console.error('Error fetching eligible members:', {
        message: errorMessage,
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      toast({
        title: "Error",
        description: `Failed to fetch eligible members: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePayoutAmount = async () => {
    try {
      // Use dynamic calculation function
      const { data } = await supabase
        .rpc('calculate_cycle_payout_amount', {
          p_cycle_id: cycle.id,
          p_commission_percentage: 0.0 // No commission for now
        })
      
      if (data && data[0]) {
        const result = data[0]
        return {
          totalCollected: parseFloat(result.total_collected || '0'),
          commission: parseFloat(result.commission_amount || '0'),
          payoutAmount: parseFloat(result.net_payout_amount || '0')
        }
      }
      
      // Fallback to old calculation if function fails
      const totalCollected = (cycle.collection_entries || [])
        .filter((entry: any) => entry.status === 'closed')
        .reduce((sum: number, entry: any) => sum + parseFloat(entry.amount_collected), 0)
      
      return {
        totalCollected,
        commission: 0,
        payoutAmount: Math.max(0, totalCollected)
      }
    } catch (error) {
      console.error('Error calculating payout amount:', error)
      
      // Fallback to old calculation
      const totalCollected = (cycle.collection_entries || [])
        .filter((entry: any) => entry.status === 'closed')
        .reduce((sum: number, entry: any) => sum + parseFloat(entry.amount_collected), 0)
      
      return {
        totalCollected,
        commission: 0,
        payoutAmount: Math.max(0, totalCollected)
      }
    }
  }

  const handleSelectWinner = async () => {
    if (!selectedWinnerId) {
      toast({
        title: "Error",
        description: "Please select a winner",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { totalCollected, commission, payoutAmount } = await calculatePayoutAmount()
      
      // Start a database transaction by using RPC function
      const selectedMember = eligibleMembers.find(m => m.member_id === selectedWinnerId)
      if (!selectedMember) {
        throw new Error('Selected member not found')
      }

      // Generate receipt number first
      const { data: receiptData, error: receiptError } = await supabase
        .rpc('generate_receipt_number')
      
      if (receiptError) throw receiptError
      
      // Get system admin ID
      const { data: systemAdminId, error: adminError } = await supabase
        .rpc('get_system_admin_id')
      
      if (adminError) throw adminError

      // Check if cycle is already completed
      const { data: cycleCheck, error: checkError } = await supabase
        .from('cycles')
        .select('status, winner_member_id')
        .eq('id', cycle.id)
        .single()
      
      if (checkError) throw checkError
      
      if (cycleCheck.status === 'completed') {
        throw new Error('This cycle has already been completed')
      }

      // Update cycle with winner and payout amount
      const { error: cycleError } = await supabase
        .from('cycles')
        .update({
          winner_member_id: selectedWinnerId,
          payout_amount: payoutAmount,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', cycle.id)

      if (cycleError) throw cycleError

      // Create payout record with generated receipt number
      const { error: payoutError } = await supabase
        .from('payouts')
        .insert({
          cycle_id: cycle.id,
          chit_fund_id: chitFund.id,
          winner_member_id: selectedWinnerId,
          total_collected: totalCollected,
          commission_amount: commission,
          commission_percentage: 0.0,
          payout_amount: payoutAmount,
          net_payout_amount: payoutAmount,
          receipt_number: receiptData || 'PAY-ERROR-0000',
          payout_date: new Date().toISOString().split('T')[0],
          notes: notes || `Winner selected for Cycle ${cycle.cycle_number}`,
          created_by: systemAdminId,
          status: 'pending'
        })

      if (payoutError) throw payoutError

      // Update member balances for all members in this chit fund
      const { error: balanceError } = await supabase.rpc('update_all_member_balances', { 
        p_chit_fund_id: chitFund.id 
      })
      
      if (balanceError) {
        console.error('Error updating member balances:', balanceError)
        // Continue anyway since the main winner selection operation succeeded
        toast({
          title: "Warning",
          description: "Winner selected successfully, but there was an issue updating member balances.",
          variant: "default"
        })
      }

      toast({
        title: "Success",
        description: `Winner selected successfully! Full payout of ${formatCurrency(payoutAmount)} will be processed.`
      })

      setIsOpen(false)
      router.refresh()
      
    } catch (error) {
      console.error('Raw error object:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error keys:', error ? Object.keys(error) : 'null/undefined')
      
      let errorMessage = 'Unknown error occurred'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      } else if (error && typeof error === 'object' && 'error' in error) {
        errorMessage = String(error.error)
      } else if (error && typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error)
      }
      
      console.error('Error selecting winner:', {
        message: errorMessage,
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      toast({
        title: "Error",
        description: `Failed to select winner: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const [payoutData, setPayoutData] = useState({ totalCollected: 0, commission: 0, payoutAmount: 0 })
  const selectedMember = eligibleMembers.find(m => m.member_id === selectedWinnerId)

  // Calculate payout amount when component loads
  useEffect(() => {
    if (cycle?.id) {
      calculatePayoutAmount().then(data => {
        setPayoutData(data)
      })
    }
  }, [cycle?.id])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Select Winner - Cycle {cycle.cycle_number}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cycle Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cycle Summary</CardTitle>
              <CardDescription>
                {chitFund.name} - Cycle {cycle.cycle_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(payoutData.totalCollected)}
                  </div>
                  <div className="text-sm text-muted-foreground">Actually Collected</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-500">
                    {formatCurrency(parseFloat(chitFund.installment_per_member) * members.length)}
                  </div>
                  <div className="text-sm text-muted-foreground">Expected ({members.length} members)</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(payoutData.payoutAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Winner Payout</div>
                </div>
              </div>
              {payoutData.totalCollected < parseFloat(chitFund.installment_per_member) * members.length && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Incomplete collection: Only {formatCurrency(payoutData.totalCollected)} collected out of {formatCurrency(parseFloat(chitFund.installment_per_member) * members.length)} expected
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="winner-select">Select Winner</Label>
              <Select value={selectedWinnerId} onValueChange={setSelectedWinnerId}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoading ? "Loading members..." : "Choose a member to be the winner"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map(member => (
                    <SelectItem key={member.member_id} value={member.member_id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <span>{member.member_name}</span>
                          {member.phone && (
                            <span className="text-sm text-muted-foreground">
                              ({member.phone})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                          {member.current_balance_status === 'ADVANCE' && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Advance: {formatCurrency(member.advance_balance)}
                            </Badge>
                          )}
                          {member.current_balance_status === 'ARREARS' && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Arrears: {formatCurrency(member.arrears_amount)}
                            </Badge>
                          )}
                          {member.current_balance_status === 'CURRENT' && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Member Details */}
            {selectedMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Winner Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedMember.member_name}</span>
                    </div>
                    {selectedMember.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{selectedMember.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance Status:</span>
                      <Badge
                        variant={
                          selectedMember.current_balance_status === 'ADVANCE'
                            ? 'secondary'
                            : selectedMember.current_balance_status === 'ARREARS'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {selectedMember.current_balance_status}
                      </Badge>
                    </div>
                    {selectedMember.advance_balance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Advance Balance:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(selectedMember.advance_balance)}
                        </span>
                      </div>
                    )}
                    {selectedMember.arrears_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arrears Amount:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(selectedMember.arrears_amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Payout Amount:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(payoutData.payoutAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this winner selection..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelectWinner}
              disabled={!selectedWinnerId || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Winner Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}