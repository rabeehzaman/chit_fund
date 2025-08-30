'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { ChitFundSelector, CycleSelector, MemberSelector } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Save, CheckCircle } from 'lucide-react'
import { ensureSystemProfile, getAnyProfileId, SYSTEM_PROFILE_ID } from '@/lib/system'

const collectionFormSchema = z.object({
  collectorId: z.string().min(1, 'Please select the collector who collected this payment'),
  chitFundId: z.string().min(1, 'Please select a chit fund'),
  cycleId: z.string().min(1, 'Please select a cycle'),
  memberId: z.string().min(1, 'Please select a member'),
  amountCollected: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'transfer'], {
    required_error: 'Please select a payment method'
  }),
  collectionDate: z.string().min(1, 'Please enter collection date'),
  notes: z.string().optional()
})

type CollectionFormValues = z.infer<typeof collectionFormSchema>

export default function CollectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [collectors, setCollectors] = useState<any[]>([])
  const [selectedChitFund, setSelectedChitFund] = useState<string | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null)

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      collectionDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash'
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

  const onSubmit = async (data: CollectionFormValues) => {
    setIsLoading(true)

    try {
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
        amountCollected: 0,
        paymentMethod: 'cash',
        collectionDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      // Reset state variables
      setSelectedChitFund(null)
      setSelectedCycle(null)

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
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedCycle(value)
                                // Reset member selection when cycle changes
                                form.setValue('memberId', '')
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
                              onValueChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount and Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amountCollected"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Collected *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
                        disabled={isLoading}
                        className="min-w-32"
                      >
                        {isLoading ? (
                          'Recording...'
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

          {/* Help Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Collection Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Step-by-step Process</h4>
                  <ol className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>1. Select the chit fund</li>
                    <li>2. Choose the appropriate cycle</li>
                    <li>3. Select the member who paid</li>
                    <li>4. Enter the amount collected</li>
                    <li>5. Choose payment method</li>
                    <li>6. Add any relevant notes</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Important Notes</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• All entries are saved as &quot;pending close&quot;</li>
                    <li>• Collections must be closed before final posting</li>
                    <li>• Verify member and amount before submitting</li>
                    <li>• Add notes for special circumstances</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}
