'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { ChitFundSelector, MemberSelector } from '@/components/shared'
import { CycleAllocationPreview } from '@/components/shared/cycle-allocation-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Save, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { ensureSystemProfile, getAnyProfileId, SYSTEM_PROFILE_ID } from '@/lib/system'
import { getMemberPaymentSummary, getAllocatedCycles } from '@/lib/payment-utils'
import type { MemberPaymentSummary, CycleAllocation } from '@/lib/payment-utils'

// Dynamic validation schema creator
const createCollectionFormSchema = (maxPayable?: number) => {
  return z.object({
    collectorId: z.string().min(1, 'Please select the collector who collected this payment'),
    chitFundId: z.string().min(1, 'Please select a chit fund'),
    memberId: z.string().min(1, 'Please select a member'),
    amountCollected: z.number()
      .min(0.01, 'Amount must be greater than 0')
      .refine((value) => {
        if (!maxPayable) return true
        return value <= maxPayable
      }, {
        message: maxPayable ?
          `Payment cannot exceed remaining obligation of ₹${maxPayable.toFixed(2)}` :
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
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<MemberPaymentSummary | null>(null)
  const [allocations, setAllocations] = useState<CycleAllocation[]>([])

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(createCollectionFormSchema(paymentSummary?.totalRemaining || undefined)),
    defaultValues: {
      collectorId: '',
      chitFundId: '',
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

  // Fetch member payment summary when member and chit fund are selected
  useEffect(() => {
    const fetchPaymentSummary = async () => {
      if (!selectedMember || !selectedChitFund) {
        setPaymentSummary(null)
        setAllocations([])
        return
      }

      try {
        const summary = await getMemberPaymentSummary(selectedMember, selectedChitFund)
        setPaymentSummary(summary)

        // Re-validate current amount
        const currentAmount = form.getValues('amountCollected')
        if (currentAmount > 0) {
          form.clearErrors('amountCollected')
          form.trigger('amountCollected')
        }
      } catch (error) {
        console.error('Error fetching payment summary:', error)
        setPaymentSummary(null)
        setAllocations([])
      }
    }

    fetchPaymentSummary()
  }, [selectedMember, selectedChitFund, form])

  const onSubmit = async (data: CollectionFormValues) => {
    setIsLoading(true)

    try {
      // Get allocation breakdown to validate and create entries
      const allocatedCycles = await getAllocatedCycles(
        data.memberId,
        data.chitFundId,
        data.amountCollected
      )

      if (!allocatedCycles || allocatedCycles.length === 0) {
        toast({
          variant: "destructive",
          title: "Payment Allocation Failed",
          description: "Unable to allocate payment. Please check the amount and try again."
        })
        setIsLoading(false)
        return
      }

      const supabase = createClient()

      // Create collection entries for each allocated cycle
      const entries = allocatedCycles.map(allocation => ({
        chit_fund_id: data.chitFundId,
        cycle_id: allocation.cycleId,
        member_id: data.memberId,
        collector_id: data.collectorId,
        amount_collected: allocation.allocatedAmount,
        payment_method: data.paymentMethod,
        collection_date: data.collectionDate,
        notes: allocatedCycles.length > 1
          ? `${data.notes || ''} [Auto-allocated: Cycle ${allocation.cycleNumber} - ${allocation.allocatedAmount}]`.trim()
          : data.notes,
        status: 'pending_close'
      }))

      const { error } = await supabase
        .from('collection_entries')
        .insert(entries)

      if (error) {
        console.error('Error creating collection entries:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to record collection. Please try again."
        })
        return
      }

      toast({
        title: "Collection recorded successfully!",
        description: `Payment of ₹${data.amountCollected.toFixed(2)} allocated across ${allocatedCycles.length} cycle${allocatedCycles.length > 1 ? 's' : ''}.`
      })

      // Reset form completely for next entry
      form.reset({
        collectorId: '',
        chitFundId: '',
        memberId: '',
        amountCollected: undefined,
        paymentMethod: 'cash',
        collectionDate: new Date().toISOString().split('T')[0],
        notes: ''
      })

      // Reset state variables
      setSelectedChitFund(null)
      setSelectedMember(null)
      setPaymentSummary(null)
      setAllocations([])

    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again."
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
                                form.setValue('memberId', '')
                                setSelectedMember(null)
                                setPaymentSummary(null)
                                setAllocations([])
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

                    {/* Payment Summary Alert */}
                    {paymentSummary && paymentSummary.totalRemaining === 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-green-800">
                              All Cycles Fully Paid
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                              This member has paid all {paymentSummary.totalCycles} cycles (₹{paymentSummary.totalPaid.toFixed(2)} / ₹{paymentSummary.totalObligation.toFixed(2)}).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Advance Payment Info */}
                    {paymentSummary && form.watch('amountCollected') > paymentSummary.installmentAmount && form.watch('amountCollected') <= paymentSummary.totalRemaining && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-800">
                              Advance Payment Detected
                            </h3>
                            <p className="text-xs text-blue-700 mt-1">
                              This payment will be automatically allocated across {Math.ceil(form.watch('amountCollected') / paymentSummary.installmentAmount)} cycles. Check the preview on the right for details.
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
                            if (!paymentSummary || currentAmount === 0) return ''
                            if (currentAmount > paymentSummary.totalRemaining) return 'border-red-500 focus:border-red-500'
                            if (currentAmount === paymentSummary.installmentAmount) return 'border-green-500 focus:border-green-500'
                            if (currentAmount > paymentSummary.installmentAmount) return 'border-blue-500 focus:border-blue-500'
                            return 'border-yellow-500 focus:border-yellow-500'
                          }

                          return (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                <span>Amount Collected *</span>
                                {paymentSummary && paymentSummary.totalRemaining > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    Remaining: ₹{paymentSummary.totalRemaining.toFixed(2)}
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder={paymentSummary ? paymentSummary.installmentAmount.toFixed(2) : "0.00"}
                                  className={getInputColorClass()}
                                  disabled={paymentSummary?.totalRemaining === 0}
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
                                    if (paymentSummary && value && value > 0) {
                                      form.trigger('amountCollected')
                                    }
                                  }}
                                />
                              </FormControl>
                              {paymentSummary && currentAmount > 0 && (
                                <div className="text-xs mt-1.5">
                                  {currentAmount > paymentSummary.totalRemaining ? (
                                    <div className="flex items-center gap-1 text-red-600">
                                      <AlertCircle className="h-3 w-3" />
                                      <span className="font-medium">
                                        Exceeds by ₹{(currentAmount - paymentSummary.totalRemaining).toFixed(2)}
                                      </span>
                                    </div>
                                  ) : currentAmount === paymentSummary.installmentAmount ? (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="h-3 w-3" />
                                      <span className="font-medium">Normal installment</span>
                                    </div>
                                  ) : currentAmount > paymentSummary.installmentAmount ? (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <TrendingUp className="h-3 w-3" />
                                      <span className="font-medium">
                                        Advance - covers {Math.floor(currentAmount / paymentSummary.installmentAmount)} cycles
                                        {currentAmount % paymentSummary.installmentAmount > 0 && ' + partial'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                      <AlertCircle className="h-3 w-3" />
                                      <span className="font-medium">Partial payment</span>
                                    </div>
                                  )}
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
                        disabled={isLoading || paymentSummary?.totalRemaining === 0}
                        className="min-w-32"
                      >
                        {isLoading ? (
                          'Recording...'
                        ) : paymentSummary?.totalRemaining === 0 ? (
                          'All Cycles Paid'
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

          {/* Cycle Allocation Preview Panel */}
          <div className="lg:col-span-1">
            <CycleAllocationPreview
              memberId={selectedMember}
              chitFundId={selectedChitFund}
              paymentAmount={form.watch('amountCollected') || 0}
            />
          </div>
        </div>
    </div>
  )
}
