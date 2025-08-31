'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Save, Send, AlertTriangle, CheckCircle, DollarSign, Calendar, User } from 'lucide-react'
import Link from 'next/link'

type CollectionEntry = Tables<'collection_entries'> & {
  chit_funds: {
    name: string
    installment_amount: number
  }
  cycles: {
    cycle_number: number
    cycle_date: string
  }
  members: {
    full_name: string
    phone: string | null
  }
}

const closingSessionSchema = z.object({
  collectorId: z.string().min(1, 'Please select a collector'),
  sessionDate: z.string().min(1, 'Please enter session date'),
  declaredTotal: z.number().min(0, 'Declared total must be 0 or greater'),
  notes: z.string().optional()
})

type ClosingSessionFormValues = z.infer<typeof closingSessionSchema>

export default function CreateClosingSessionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [collectors, setCollectors] = useState<any[]>([])
  const [pendingCollections, setPendingCollections] = useState<CollectionEntry[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [selectedCollector, setSelectedCollector] = useState<string>('')

  const form = useForm<ClosingSessionFormValues>({
    resolver: zodResolver(closingSessionSchema),
    defaultValues: {
      sessionDate: new Date().toISOString().split('T')[0],
      declaredTotal: undefined as any
    }
  })

  // Calculate system total from selected collections
  const systemTotal = selectedCollections.reduce((total, collectionId) => {
    const collection = pendingCollections.find(c => c.id === collectionId)
    return total + (collection?.amount_collected || 0)
  }, 0)

  const declaredTotal = form.watch('declaredTotal') || 0
  const variance = declaredTotal - systemTotal

  // Fetch collectors on component mount
  useEffect(() => {
    fetchCollectors()
  }, [])

  // Fetch pending collections when collector changes
  useEffect(() => {
    if (selectedCollector) {
      fetchPendingCollections(selectedCollector)
    } else {
      setPendingCollections([])
      setSelectedCollections([])
    }
  }, [selectedCollector])

  const fetchCollectors = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching collectors:', error)
    }
  }

  const fetchPendingCollections = async (collectorId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('collection_entries')
        .select(`
          *,
          chit_funds (name, installment_amount),
          cycles (cycle_number, cycle_date),
          members (full_name, phone)
        `)
        .eq('collector_id', collectorId)
        .eq('status', 'pending_close')
        .order('collection_date', { ascending: false })

      if (!error && data) {
        setPendingCollections(data)
        // Auto-select all by default
        setSelectedCollections(data.map(c => c.id))
      }
    } catch (error) {
      console.error('Error fetching pending collections:', error)
    }
  }

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCollections(pendingCollections.map(c => c.id))
    } else {
      setSelectedCollections([])
    }
  }

  const onSubmit = async (data: ClosingSessionFormValues, isDraft: boolean = true) => {
    if (selectedCollections.length === 0) {
      toast({
        variant: "destructive",
        title: "No collections selected",
        description: "Please select at least one collection to close."
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { data: sessionData, error } = await supabase
        .from('closing_sessions')
        .insert({
          collector_id: data.collectorId,
          session_date: data.sessionDate,
          declared_total: data.declaredTotal,
          system_total: systemTotal,
          entries_count: selectedCollections.length,
          status: isDraft ? 'draft' : 'submitted',
          notes: data.notes,
          submitted_at: isDraft ? null : new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating closing session:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create closing session. Please try again."
        })
        return
      }

      // Update collection entries with closing session ID
      const { error: updateError } = await supabase
        .from('collection_entries')
        .update({ closing_session_id: sessionData.id })
        .in('id', selectedCollections)

      if (updateError) {
        console.error('Error updating collection entries:', updateError)
        // TODO: Should rollback the closing session creation
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to link collections to closing session."
        })
        return
      }

      toast({
        title: isDraft ? "Draft saved successfully!" : "Closing session submitted!",
        description: isDraft 
          ? "The closing session has been saved as draft." 
          : "The closing session has been submitted for approval."
      })

      router.push('/closings')

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


  const getVarianceColor = () => {
    if (variance === 0) return 'text-green-600'
    if (Math.abs(variance) <= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getVarianceBadgeVariant = () => {
    if (variance === 0) return 'default'
    if (Math.abs(variance) <= 50) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Closing Session</h1>
          <p className="text-gray-600">Aggregate pending collections into a cash batch for approval</p>
        </div>
        <Link href="/closings">
          <Button variant="outline">
            ← Back to Closings
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, true))} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>
                    Enter the basic information for this closing session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Collector Selection */}
                  <FormField
                    control={form.control}
                    name="collectorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collector *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedCollector(value)
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select collector" />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Session Date */}
                    <FormField
                      control={form.control}
                      name="sessionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Declared Total */}
                    <FormField
                      control={form.control}
                      name="declaredTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declared Total *</FormLabel>
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
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about this closing session..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Collections Selection */}
              {selectedCollector && pendingCollections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Collections</CardTitle>
                    <CardDescription>
                      Select collections to include in this closing session
                    </CardDescription>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedCollections.length === pendingCollections.length && pendingCollections.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Select All ({pendingCollections.length} collections)
                      </label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Fund</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Cycle</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingCollections.map((collection) => (
                          <TableRow key={collection.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCollections.includes(collection.id)}
                                onCheckedChange={() => handleCollectionToggle(collection.id)}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(collection.collection_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{collection.chit_funds.name}</TableCell>
                            <TableCell>{collection.members.full_name}</TableCell>
                            <TableCell>#{collection.cycles.cycle_number}</TableCell>
                            <TableCell>{formatCurrency(collection.amount_collected)}</TableCell>
                            <TableCell>
                              <Badge variant={collection.payment_method === 'cash' ? 'default' : 'secondary'}>
                                {collection.payment_method}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {selectedCollector && pendingCollections.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Collections</h3>
                    <p className="text-gray-600">
                      The selected collector has no pending collections to close.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary Section */}
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
                    <span className="font-medium">{formatCurrency(declaredTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">System Total:</span>
                    <span className="font-medium">{formatCurrency(systemTotal)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Variance:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getVarianceColor()}`}>
                          {formatCurrency(variance)}
                        </span>
                        <Badge variant={getVarianceBadgeVariant()}>
                          {variance === 0 ? 'Perfect' : variance > 0 ? 'Over' : 'Under'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Selected: {selectedCollections.length} collections
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
                            ? `You declared ${formatCurrency(Math.abs(variance))} more than the system total.`
                            : `You declared ${formatCurrency(Math.abs(variance))} less than the system total.`
                          }
                        </p>
                        <p className="text-xs text-amber-600">
                          Please verify your cash count before submitting.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading || selectedCollections.length === 0}
                      className="w-full"
                    >
                      {isLoading ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save as Draft
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="default"
                      disabled={isLoading || selectedCollections.length === 0}
                      className="w-full"
                      onClick={form.handleSubmit((data) => onSubmit(data, false))}
                    >
                      {isLoading ? (
                        'Submitting...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Approval
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Draft sessions can be edited later. Submitted sessions cannot be modified.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}