'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Banknote, CreditCard, FileText, Loader2, Receipt, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Cycle {
  id: string
  cycle_number: number
  cycle_date: string
  payout_amount?: string
}

interface ChitFund {
  id: string
  name: string
  installment_per_member: string
}

interface Winner {
  full_name: string
}

interface PayoutDialogProps {
  cycle: Cycle
  chitFund: ChitFund
  winner: Winner
  children: React.ReactNode
}

export function PayoutDialog({ 
  cycle, 
  chitFund, 
  winner, 
  children 
}: PayoutDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [payoutMethod, setPayoutMethod] = useState<'cash' | 'transfer' | 'cheque' | 'upi'>('cash')
  const [bankDetails, setBankDetails] = useState('')
  const [chequeNumber, setChequeNumber] = useState('')
  const [upiTransactionId, setUpiTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const payoutAmount = parseFloat(cycle.payout_amount || '0')

  const handleProcessPayout = async () => {
    if (!payoutMethod) {
      toast({
        title: "Error",
        description: "Please select a payout method",
        variant: "destructive"
      })
      return
    }

    // Validation based on payment method
    if (payoutMethod === 'cheque' && !chequeNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter cheque number",
        variant: "destructive"
      })
      return
    }

    if (payoutMethod === 'transfer' && !bankDetails.trim()) {
      toast({
        title: "Error",
        description: "Please enter bank details",
        variant: "destructive"
      })
      return
    }

    if (payoutMethod === 'upi' && !upiTransactionId.trim()) {
      toast({
        title: "Error",
        description: "Please enter UPI transaction ID",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Get system admin ID
      const { data: systemAdminId, error: adminError } = await supabase
        .rpc('get_system_admin_id')
      
      if (adminError) throw adminError

      // Update the existing payout record with payment details
      const updateData: any = {
        payout_method: payoutMethod,
        notes: notes || `Payout processed for Cycle ${cycle.cycle_number}`,
        approved_by: systemAdminId,
        approved_at: new Date().toISOString(),
        status: 'paid',
        updated_at: new Date().toISOString()
      }

      if (payoutMethod === 'cheque') {
        updateData.cheque_number = chequeNumber
      } else if (payoutMethod === 'transfer') {
        updateData.bank_details = bankDetails
      } else if (payoutMethod === 'upi') {
        updateData.upi_transaction_id = upiTransactionId
      }

      const { error: payoutError } = await supabase
        .from('payouts')
        .update(updateData)
        .eq('cycle_id', cycle.id)

      if (payoutError) throw payoutError

      toast({
        title: "Success",
        description: `Payout of ${formatCurrency(payoutAmount)} has been processed successfully!`
      })

      setIsOpen(false)
      router.refresh()
      
    } catch (error) {
      console.error('Error processing payout:', error)
      toast({
        title: "Error",
        description: "Failed to process payout. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'transfer':
        return <CreditCard className="h-4 w-4" />
      case 'cheque':
        return <FileText className="h-4 w-4" />
      case 'upi':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Banknote className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-green-500" />
            <span>Process Payout</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payout Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payout Details</CardTitle>
              <CardDescription>
                {chitFund.name} - Cycle {cycle.cycle_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winner:</span>
                  <span className="font-medium">{winner.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cycle:</span>
                  <span>{cycle.cycle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(cycle.cycle_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Payout Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(payoutAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center space-x-2">
                      <Banknote className="h-4 w-4" />
                      <span>Cash</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Bank Transfer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cheque">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Cheque</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>UPI</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Method-specific fields */}
            {payoutMethod === 'transfer' && (
              <div>
                <Label htmlFor="bank-details">Bank Details</Label>
                <Textarea
                  id="bank-details"
                  placeholder="Enter bank account details (Account number, IFSC, etc.)"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {payoutMethod === 'cheque' && (
              <div>
                <Label htmlFor="cheque-number">Cheque Number</Label>
                <Input
                  id="cheque-number"
                  placeholder="Enter cheque number"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                />
              </div>
            )}

            {payoutMethod === 'upi' && (
              <div>
                <Label htmlFor="upi-transaction-id">UPI Transaction ID</Label>
                <Input
                  id="upi-transaction-id"
                  placeholder="Enter UPI transaction ID"
                  value={upiTransactionId}
                  onChange={(e) => setUpiTransactionId(e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payout..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Summary Card */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPaymentMethodIcon(payoutMethod)}
                  <span className="font-medium">
                    {payoutMethod.charAt(0).toUpperCase() + payoutMethod.slice(1)} Payment
                  </span>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(payoutAmount)}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Payment will be processed to {winner.full_name}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayout}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Payout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}