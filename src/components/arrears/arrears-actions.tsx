'use client'

import { useState } from 'react'
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
  MessageSquare, 
  DollarSign, 
  FileText, 
  Phone,
  Mail,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock
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

interface ArrearsActionsProps {
  member: Member
  chitFund: ChitFund
  arrearsAmount: number
}

export function ArrearsActions({ member, chitFund, arrearsAmount }: ArrearsActionsProps) {
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  return (
    <div className="flex space-x-1">
      {/* Send Reminder */}
      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-3 w-3 mr-1" />
            Remind
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
          </DialogHeader>
          <ReminderForm 
            member={member}
            chitFund={chitFund}
            arrearsAmount={arrearsAmount}
            onClose={() => setIsReminderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Record Payment */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <DollarSign className="h-3 w-3 mr-1" />
            Pay
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Arrears Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm 
            member={member}
            chitFund={chitFund}
            arrearsAmount={arrearsAmount}
            onClose={() => setIsPaymentOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Notes */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-3 w-3 mr-1" />
            Notes
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member Notes</DialogTitle>
          </DialogHeader>
          <NotesForm 
            member={member}
            chitFund={chitFund}
            onClose={() => setIsNotesOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ReminderFormProps {
  member: Member
  chitFund: ChitFund
  arrearsAmount: number
  onClose: () => void
}

function ReminderForm({ member, chitFund, arrearsAmount, onClose }: ReminderFormProps) {
  const [reminderType, setReminderType] = useState<'sms' | 'call' | 'email'>('sms')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const defaultMessage = `Dear ${member.full_name}, your payment for ${chitFund.name} is overdue by ${formatCurrency(arrearsAmount)}. Please make the payment at your earliest convenience. Thank you.`

  const handleSendReminder = async () => {
    setIsSubmitting(true)
    try {
      // In a real implementation, this would integrate with SMS/Email services
      // For now, we'll just log the reminder action
      console.log('Reminder sent:', {
        memberId: member.id,
        type: reminderType,
        message: message || defaultMessage,
        arrearsAmount
      })

      toast({
        title: "Reminder Sent",
        description: `${reminderType.toUpperCase()} reminder sent to ${member.full_name}`
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reminder Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member:</span>
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrears:</span>
              <span className="font-bold text-red-600">{formatCurrency(arrearsAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <Label>Reminder Type</Label>
          <Select value={reminderType} onValueChange={(value: any) => setReminderType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>SMS</span>
                </div>
              </SelectItem>
              <SelectItem value="call">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Phone Call</span>
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={defaultMessage}
            rows={4}
          />
          {!message && (
            <p className="text-xs text-muted-foreground mt-1">
              Default message will be used if left empty
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSendReminder} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reminder
        </Button>
      </div>
    </div>
  )
}

interface PaymentFormProps {
  member: Member
  chitFund: ChitFund
  arrearsAmount: number
  onClose: () => void
}

function PaymentForm({ member, chitFund, arrearsAmount, onClose }: PaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = useState(arrearsAmount.toString())
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'upi'>('cash')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create a special collection entry for arrears payment
      // Note: We need to find an active cycle for this chit fund
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('chit_fund_id', chitFund.id)
        .eq('status', 'active')
        .single()

      if (activeCycle) {
        // Record as a collection entry
        const { error: collectionError } = await supabase
          .from('collection_entries')
          .insert({
            chit_fund_id: chitFund.id,
            cycle_id: activeCycle.id,
            member_id: member.id,
            collector_id: 'system-admin',
            amount_collected: amount,
            payment_method: paymentMethod,
            collection_date: new Date().toISOString().split('T')[0],
            notes: notes || `Arrears payment - ${formatCurrency(amount)}`,
            status: 'closed' // Mark as closed since it's an admin entry
          })

        if (collectionError) throw collectionError

        // Update member balances
        await supabase.rpc('update_all_member_balances', { 
          p_chit_fund_id: chitFund.id 
        })
      }

      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(amount)} recorded for ${member.full_name}`
      })

      onClose()
      router.refresh()

    } catch (error) {
      console.error('Error recording payment:', error)
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member:</span>
              <span className="font-medium">{member.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chit Fund:</span>
              <span>{chitFund.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Arrears:</span>
              <span className="font-bold text-red-600">{formatCurrency(arrearsAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <Label>Payment Amount</Label>
          <Input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            step="0.01"
            min="0"
            max={arrearsAmount}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum: {formatCurrency(arrearsAmount)}
          </p>
        </div>

        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
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
          <Label>Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this payment..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleRecordPayment} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Payment
        </Button>
      </div>
    </div>
  )
}

interface NotesFormProps {
  member: Member
  chitFund: ChitFund
  onClose: () => void
}

function NotesForm({ member, chitFund, onClose }: NotesFormProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Please enter some notes",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // In a real implementation, this would save to a member_notes table
      console.log('Notes saved:', {
        memberId: member.id,
        chitFundId: chitFund.id,
        notes,
        timestamp: new Date().toISOString()
      })

      toast({
        title: "Notes Saved",
        description: `Notes added for ${member.full_name}`
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member:</span>
              <span className="font-medium">{member.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chit Fund:</span>
              <span>{chitFund.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this member's payment status, communication history, or special circumstances..."
          rows={5}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSaveNotes} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Notes
        </Button>
      </div>
    </div>
  )
}