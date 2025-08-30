'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  ArrowRight, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  full_name: string
  phone?: string
}

interface ChitFund {
  id: string
  name: string
  installment_amount: string | number
}

interface AdvanceActionsProps {
  member: Member
  chitFund: ChitFund
  advanceBalance: number
  cyclesPrepaid: number
}

export function AdvanceActions({ member, chitFund, advanceBalance, cyclesPrepaid }: AdvanceActionsProps) {
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)

  return (
    <div className="flex space-x-1">
      {/* Apply to Specific Cycle */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowRight className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Advance to Specific Cycle</DialogTitle>
          </DialogHeader>
          <ApplyAdvanceForm 
            member={member}
            chitFund={chitFund}
            advanceBalance={advanceBalance}
            onClose={() => setIsApplyOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Details */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            Details
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance Payment Details</DialogTitle>
          </DialogHeader>
          <AdvanceDetailsView 
            member={member}
            chitFund={chitFund}
            advanceBalance={advanceBalance}
            cyclesPrepaid={cyclesPrepaid}
          />
        </DialogContent>
      </Dialog>

      {/* Process Refund (if needed) */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <DollarSign className="h-3 w-3 mr-1" />
            Refund
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Advance Refund</DialogTitle>
          </DialogHeader>
          <RefundAdvanceForm 
            member={member}
            chitFund={chitFund}
            advanceBalance={advanceBalance}
            onClose={() => setIsRefundOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ApplyAdvanceFormProps {
  member: Member
  chitFund: ChitFund
  advanceBalance: number
  onClose: () => void
}

function ApplyAdvanceForm({ member, chitFund, advanceBalance, onClose }: ApplyAdvanceFormProps) {
  const [selectedCycleId, setSelectedCycleId] = useState<string>('')
  const [amountToApply, setAmountToApply] = useState(Math.min(advanceBalance, parseFloat(chitFund.installment_amount.toString())).toString())
  const [availableCycles, setAvailableCycles] = useState<any[]>([])
  const [isLoadingCycles, setIsLoadingCycles] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    fetchAvailableCycles()
  }, [])

  const fetchAvailableCycles = async () => {
    try {
      // Get unpaid upcoming/active cycles for this member and chit fund
      const { data: cycles } = await supabase
        .from('cycles')
        .select(`
          id,
          cycle_number,
          cycle_date,
          status
        `)
        .eq('chit_fund_id', chitFund.id)
        .in('status', ['upcoming', 'active'])
        .order('cycle_number')

      if (cycles) {
        // Filter out cycles that already have payments
        const { data: existingPayments } = await supabase
          .from('collection_entries')
          .select('cycle_id')
          .eq('member_id', member.id)
          .eq('status', 'closed')
          .in('cycle_id', cycles.map(c => c.id))

        const paidCycleIds = existingPayments?.map(p => p.cycle_id) || []
        const unpaidCycles = cycles.filter(c => !paidCycleIds.includes(c.id))
        
        setAvailableCycles(unpaidCycles)
      }
    } catch (error) {
      console.error('Error fetching cycles:', error)
      toast({
        title: "Error",
        description: "Failed to fetch available cycles",
        variant: "destructive"
      })
    } finally {
      setIsLoadingCycles(false)
    }
  }

  const handleApplyAdvance = async () => {
    const amount = parseFloat(amountToApply)
    if (isNaN(amount) || amount <= 0 || amount > advanceBalance) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    if (!selectedCycleId) {
      toast({
        title: "Error",
        description: "Please select a cycle",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .rpc('apply_advance_to_cycle', {
          p_member_id: member.id,
          p_cycle_id: selectedCycleId,
          p_chit_fund_id: chitFund.id,
          p_amount_to_apply: amount
        })

      if (error) throw error

      if (data) {
        toast({
          title: "Success",
          description: `Applied ${formatCurrency(amount)} from advance to selected cycle`
        })
        onClose()
        router.refresh()
      } else {
        throw new Error('Failed to apply advance')
      }
    } catch (error) {
      console.error('Error applying advance:', error)
      toast({
        title: "Error",
        description: "Failed to apply advance to cycle",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCycle = availableCycles.find(c => c.id === selectedCycleId)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Apply Advance Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member:</span>
              <span className="font-medium">{member.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Advance:</span>
              <span className="font-bold text-green-600">{formatCurrency(advanceBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Installment Amount:</span>
              <span>{formatCurrency(parseFloat(chitFund.installment_amount.toString()))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <Label>Select Cycle</Label>
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingCycles ? "Loading cycles..." : "Choose a cycle"} />
            </SelectTrigger>
            <SelectContent>
              {availableCycles.map(cycle => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>Cycle {cycle.cycle_number}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(cycle.cycle_date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {cycle.status}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Amount to Apply</Label>
          <Input
            type="number"
            value={amountToApply}
            onChange={(e) => setAmountToApply(e.target.value)}
            step="0.01"
            min="0"
            max={advanceBalance}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum: {formatCurrency(advanceBalance)}
          </p>
        </div>

        {selectedCycle && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Selected Cycle:</span>
                  <Badge variant="secondary">
                    Cycle {selectedCycle.cycle_number}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm">{new Date(selectedCycle.cycle_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount to Apply:</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(parseFloat(amountToApply) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Remaining Advance:</span>
                  <span className="text-sm">
                    {formatCurrency(advanceBalance - (parseFloat(amountToApply) || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleApplyAdvance}
          disabled={isSubmitting || !selectedCycleId || !amountToApply}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Apply Advance
        </Button>
      </div>
    </div>
  )
}

interface AdvanceDetailsViewProps {
  member: Member
  chitFund: ChitFund
  advanceBalance: number
  cyclesPrepaid: number
}

function AdvanceDetailsView({ member, chitFund, advanceBalance, cyclesPrepaid }: AdvanceDetailsViewProps) {
  const installmentAmount = parseFloat(chitFund.installment_amount.toString())
  const partialAmount = advanceBalance % installmentAmount

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{member.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span>{member.phone || 'Not available'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chit Fund:</span>
              <span>{chitFund.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Advance Balance:</span>
              <span className="font-bold text-green-600 text-lg">
                {formatCurrency(advanceBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Installment Amount:</span>
              <span>{formatCurrency(installmentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Cycles Covered:</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {cyclesPrepaid} cycles
                </Badge>
                <span className="text-sm text-muted-foreground">
                  = {formatCurrency(cyclesPrepaid * installmentAmount)}
                </span>
              </div>
            </div>
            {partialAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partial Payment Available:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-600">
                    {formatCurrency(partialAmount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({((partialAmount / installmentAmount) * 100).toFixed(1)}% of next installment)
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">
                {cyclesPrepaid > 0 ? `${cyclesPrepaid} future payments secured` : 'Partial advance available'}
              </div>
              <div className="text-sm text-green-600">
                {cyclesPrepaid > 0 
                  ? `Member won't need to pay for the next ${cyclesPrepaid} cycle${cyclesPrepaid !== 1 ? 's' : ''}` 
                  : `${formatCurrency(partialAmount)} will be applied to the next payment`
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface RefundAdvanceFormProps {
  member: Member
  chitFund: ChitFund
  advanceBalance: number
  onClose: () => void
}

function RefundAdvanceForm({ member, chitFund, advanceBalance, onClose }: RefundAdvanceFormProps) {
  const [refundAmount, setRefundAmount] = useState(advanceBalance.toString())
  const [refundMethod, setRefundMethod] = useState<'cash' | 'transfer' | 'upi'>('cash')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleProcessRefund = async () => {
    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0 || amount > advanceBalance) {
      toast({
        title: "Error",
        description: "Please enter a valid refund amount",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // In a real implementation, this would integrate with payment processing
      console.log('Refund processed:', {
        memberId: member.id,
        chitFundId: chitFund.id,
        amount,
        method: refundMethod,
        notes
      })

      toast({
        title: "Refund Processed",
        description: `Refund of ${formatCurrency(amount)} processed for ${member.full_name}`
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <div className="font-medium text-orange-800">
                Advance Refund Request
              </div>
              <div className="text-sm text-orange-600">
                This will reduce the member&apos;s advance balance and process a refund payment.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Refund Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member:</span>
              <span className="font-medium">{member.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Advance:</span>
              <span className="font-bold text-green-600">{formatCurrency(advanceBalance)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <Label>Refund Amount</Label>
          <Input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            step="0.01"
            min="0"
            max={advanceBalance}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum: {formatCurrency(advanceBalance)}
          </p>
        </div>

        <div>
          <Label>Refund Method</Label>
          <Select value={refundMethod} onValueChange={(value: any) => setRefundMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this refund..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleProcessRefund} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Process Refund
        </Button>
      </div>
    </div>
  )
}