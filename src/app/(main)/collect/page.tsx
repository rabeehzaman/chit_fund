'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { ChitFundSelector, CycleSelector, MemberSelector } from '@/components/shared'
import { PaymentPreview } from '@/components/shared/payment-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'
import { ensureSystemProfile, getAnyProfileId, SYSTEM_PROFILE_ID } from '@/lib/system'
import { calculatePaymentLimits, validatePaymentAmount, getPaymentMessage, getCyclePaymentStatus, validatePaymentAttempt, getNextPayableCycle } from '@/lib/payment-utils'
import type { PaymentLimits, CyclePaymentStatus, PaymentValidation, NextPayableCycle } from '@/lib/payment-utils'

// Dynamic validation schema creator
const createCollectionFormSchema = (paymentLimits?: PaymentLimits) => {
  return z.object({
    collectorId: z.string().min(1, 'Please select the collector who collected this payment'),
    chitFundId: z.string().min(1, 'Please select a chit fund'),
    cycleId: z.string().min(1, 'Please select a cycle'),
    memberId: z.string().min(1, 'Please select a member'),
    amountCollected: z.number()
      .min(0.01, 'Amount must be greater than 0')
      .refine((value) => {
        if (!paymentLimits) return true
        const validation = validatePaymentAmount(value, paymentLimits)
        return validation.isValid
      }, {
        message: paymentLimits ? 
          `Payment must be between ₹${paymentLimits.minimum.toFixed(2)} and ₹${paymentLimits.maximum.toFixed(2)}` :
          'Invalid payment amount'
      }),
    paymentMethod: z.enum(['cash', 'transfer'], {
      required_error: 'Please select a payment method'
    }),
    collectionDate: z.string().min(1, 'Please enter collection date'),
    notes: z.string().optional()
  })
}

type CollectionFormValues = z.infer<ReturnType<typeof createCollectionFormSchema>>

export default function CollectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [collectors, setCollectors] = useState<any[]>([])
  const [selectedChitFund, setSelectedChitFund] = useState<string | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [paymentLimits, setPaymentLimits] = useState<PaymentLimits | null>(null)
  const [cyclePaymentStatus, setCyclePaymentStatus] = useState<CyclePaymentStatus | null>(null)
  const [nextPayableCycle, setNextPayableCycle] = useState<NextPayableCycle | null>(null)

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(createCollectionFormSchema(paymentLimits || undefined)),
    defaultValues: {
      collectorId: '',
      chitFundId: '',
      cycleId: '',
      memberId: '',
      amountCollected: undefined as any,
      paymentMethod: 'cash',
      collectionDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  })

  // Fetch collectors on component mount
  useEffect(() => {
    const fetchCollectors = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'collector')
        .eq('is_active', true)
        .order('full_name')

      if (!error && data) {
        setCollectors(data)
      }
    }

    fetchCollectors()
  }, [])

  // Fetch cycle payment status when member, cycle, and chit fund are selected
  useEffect(() => {
    const fetchCyclePaymentStatus = async () => {
      if (!selectedMember || !selectedCycle || !selectedChitFund) {
        setCyclePaymentStatus(null)
        setPaymentLimits(null)
        setNextPayableCycle(null)
        return
      }

      try {
        // Get cycle payment status
        const status = await getCyclePaymentStatus(selectedMember, selectedCycle)
        setCyclePaymentStatus(status)
        
        // If cycle is fully paid, suggest next cycle
        if (status?.isFullyPaid) {
          const nextCycle = await getNextPayableCycle(selectedMember, selectedChitFund, selectedCycle)
          setNextPayableCycle(nextCycle)
        } else {
          setNextPayableCycle(null)
        }

        // Set payment limits based on cycle status
        if (status && !status.isFullyPaid) {
          const limits: PaymentLimits = {
            minimum: 1,
            maximum: status.remainingAmount,
            recommended: Math.min(status.installmentAmount, status.remainingAmount),
            totalObligation: status.installmentAmount,
            totalPaid: status.amountPaid,
            remainingObligation: status.remainingAmount,
            installmentAmount: status.installmentAmount,
            cyclesRemaining: 1,
            totalCycles: 1
          }
          setPaymentLimits(limits)
        } else {
          setPaymentLimits(null)
        }
        
        // Re-validate current amount
        const currentAmount = form.getValues('amountCollected')
        if (currentAmount > 0) {
          form.clearErrors('amountCollected')
          form.trigger('amountCollected')
        }
      } catch (error) {
        console.error('Error fetching cycle payment status:', error)
        setCyclePaymentStatus(null)
        setPaymentLimits(null)
        setNextPayableCycle(null)
      }
    }

    fetchCyclePaymentStatus()
  }, [selectedMember, selectedCycle, selectedChitFund, form])

  const onSubmit = async (data: CollectionFormValues) => {
    setIsLoading(true)

    try {
      // CRITICAL SECURITY: Server-side validation to prevent overpayment and duplicates
      const validation = await validatePaymentAttempt(
        data.memberId, 
        data.cycleId, 
        data.amountCollected
      )
      
      if (!validation.isValid) {
        toast({
          variant: "destructive", 
          title: "Payment Validation Failed",
          description: validation.errorMessage
        })
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      
      const { error } = await supabase
        .from('collection_entries')
        .insert({
          chit_fund_id: data.chitFundId,
          cycle_id: data.cycleId,
          member_id: data.memberId,
          collector_id: data.collectorId,
          amount_collected: data.amountCollected,
          payment_method: data.paymentMethod,
          collection_date: data.collectionDate,
          notes: data.notes,
          status: 'pending_close'
        })

      if (error) {
        console.error('Error creating collection entry:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to record collection. Please try again."
        })
        return
      }

      toast({
        title: "Collection recorded successfully!",
        description: "The payment has been recorded and is pending closure."
      })

      // Reset form completely for next entry
      form.reset({
        collectorId: '',
        chitFundId: '',
        cycleId: '',
        memberId: '',
        amountCollected: undefined,
        paymentMethod: 'cash',
        collectionDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      // Reset state variables
      setSelectedChitFund(null)
      setSelectedCycle(null)
      setSelectedMember(null)
      setPaymentLimits(null)
      setCyclePaymentStatus(null)
      setNextPayableCycle(null)

    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collection Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Collection Entry</CardTitle>
                <CardDescription>
                  Record a payment collection from a member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Collector Selection */}
                    <FormField
                      control={form.control}
                      name="collectorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collected By *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select the collector who collected this payment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {collectors.map((collector) => (
                                <SelectItem key={collector.id} value={collector.id}>
                                  {collector.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Chit Fund Selection */}
                    <FormField
                      control={form.control}
                      name="chitFundId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chit Fund *</FormLabel>
                          <FormControl>
                            <ChitFundSelector
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedChitFund(value)
                                // Reset dependent fields
                                form.setValue('cycleId', '')
                                form.setValue('memberId', '')
                                setSelectedCycle(null)
                                setSelectedMember(null)
                                setPaymentLimits(null)
                                setCyclePaymentStatus(null)
                                setNextPayableCycle(null)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cycle Selection */}
                    <FormField
                      control={form.control}
                      name="cycleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cycle *</FormLabel>
                          <FormControl>
                            <CycleSelector
                              chitFundId={selectedChitFund}
                              memberId={selectedMember}
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedCycle(value)
                                // Clear payment status when cycle changes (will be refetched by useEffect)
                                setCyclePaymentStatus(null)
                                setNextPayableCycle(null)
                                setPaymentLimits(null)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Member Selection */}
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Member *</FormLabel>
                          <FormControl>
                            <MemberSelector
                              chitFundId={selectedChitFund}
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedMember(value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Status Alert */}
                    {cyclePaymentStatus?.isFullyPaid && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-amber-800">
                              Cycle Already Fully Paid
                            </h3>
                            <p className="text-sm text-amber-700 mt-1">
                              This cycle has been fully paid (₹{cyclePaymentStatus.amountPaid.toFixed(2)} / ₹{cyclePaymentStatus.installmentAmount.toFixed(2)}).
                              {nextPayableCycle && (
                                <> Consider selecting <strong>Cycle {nextPayableCycle.cycleNumber}</strong> for the next payment.</>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amount and Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amountCollected"
                        render={({ field }) => {
                          const currentAmount = field.value || 0
                          const getInputColorClass = () => {
                            if (!paymentLimits || currentAmount === 0) return ''
                            if (currentAmount === paymentLimits.installmentAmount) return 'border-green-500 focus:border-green-500'
                            if (currentAmount > paymentLimits.installmentAmount && currentAmount <= paymentLimits.maximum) return 'border-blue-500 focus:border-blue-500'
                            if (currentAmount > paymentLimits.maximum) return 'border-red-500 focus:border-red-500'
                            return 'border-yellow-500 focus:border-yellow-500'
                          }
                          
                          return (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                <span>Amount Collected *</span>
                                {paymentLimits && !cyclePaymentStatus?.isFullyPaid && (
                                  <span className="text-xs text-muted-foreground">
                                    Max: ₹{paymentLimits.maximum.toFixed(2)} | Paid: ₹{cyclePaymentStatus?.amountPaid.toFixed(2) || '0.00'}
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder={cyclePaymentStatus?.isFullyPaid ? "Cycle fully paid" : paymentLimits ? paymentLimits.maximum.toFixed(2) : "0.00"}
                                  className={getInputColorClass()}
                                  disabled={cyclePaymentStatus?.isFullyPaid}
                                  {...field}
                                  onFocus={(e) => {
                                    // Auto-select all content when focused for better UX
                                    e.target.select()
                                  }}
                                  onChange={(e) => {
                                    const inputValue = e.target.value
                                    const value = inputValue === '' ? undefined : parseFloat(inputValue) || 0
                                    field.onChange(value)

                                    // Trigger validation through the resolver
                                    if (paymentLimits && value && value > 0) {
                                      form.trigger('amountCollected')
                                    }
                                  }}
                                />
                              </FormControl>
                              {paymentLimits && currentAmount > 0 && (
                                <div className="text-xs mt-1">
                                  {(() => {
                                    const message = getPaymentMessage(currentAmount, paymentLimits)
                                    const colorClass = {
                                      success: 'text-green-600',
                                      info: 'text-blue-600',
                                      warning: 'text-yellow-600',
                                      error: 'text-red-600'
                                    }[message.type]
                                    return <span className={colorClass}>{message.message}</span>
                                  })()}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="transfer">Bank Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Collection Date */}
                    <FormField
                      control={form.control}
                      name="collectionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collection Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes about this collection..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="submit"
                        disabled={isLoading || cyclePaymentStatus?.isFullyPaid}
                        className="min-w-32"
                      >
                        {isLoading ? (
                          'Recording...'
                        ) : cyclePaymentStatus?.isFullyPaid ? (
                          'Cycle Fully Paid'
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Record Collection
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Preview Panel */}
          <div className="lg:col-span-1">
            <PaymentPreview
              memberId={selectedMember}
              chitFundId={selectedChitFund}
              paymentAmount={form.watch('amountCollected') || 0}
            />
          </div>
        </div>
    </div>
  )
}
