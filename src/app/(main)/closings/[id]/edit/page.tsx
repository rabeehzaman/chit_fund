'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Save, Send, AlertTriangle, CheckCircle, DollarSign, ArrowLeft, XCircle } from 'lucide-react'
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

type ClosingSession = Tables<'closing_sessions'> & {
  profiles: {
    full_name: string | null
  }
  collection_entries: CollectionEntry[]
}

const closingSessionSchema = z.object({
  sessionDate: z.string().min(1, 'Please enter session date'),
  declaredTotal: z.number().min(0, 'Declared total must be 0 or greater'),
  notes: z.string().optional()
})

type ClosingSessionFormValues = z.infer<typeof closingSessionSchema>

export default function EditClosingSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<ClosingSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [availableCollections, setAvailableCollections] = useState<CollectionEntry[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  const form = useForm<ClosingSessionFormValues>({
    resolver: zodResolver(closingSessionSchema),
    defaultValues: {
      declaredTotal: 0
    }
  })

  // Calculate system total from selected collections
  const systemTotal = selectedCollections.reduce((total, collectionId) => {
    const collection = availableCollections.find(c => c.id === collectionId)
    return total + (collection?.amount_collected || 0)
  }, 0)

  const declaredTotal = form.watch('declaredTotal') || 0
  const variance = declaredTotal - systemTotal

  useEffect(() => {
    if (sessionId) {
      fetchClosingSession()
    }
  }, [sessionId])

  const fetchClosingSession = async () => {
    setPageLoading(true)
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
            chit_funds (name, installment_amount),
            cycles (cycle_number, cycle_date),
            members (full_name, phone)
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

      if (data.status !== 'draft') {
        toast({
          variant: "destructive",
          title: "Cannot edit",
          description: "Only draft sessions can be edited."
        })
        router.push(`/closings/${sessionId}/view`)
        return
      }

      setSession(data)
      
      // Set form values
      form.setValue('sessionDate', data.session_date)
      form.setValue('declaredTotal', data.declared_total)
      form.setValue('notes', data.notes || '')

      // Fetch available collections for this collector
      await fetchAvailableCollections(data.collector_id, data.collection_entries)
      
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchAvailableCollections = async (collectorId: string, currentCollections: CollectionEntry[]) => {
    try {
      const supabase = createClient()
      
      // Get all pending collections for this collector
      const { data, error } = await supabase
        .from('collection_entries')
        .select(`
          id,
          amount_collected,
          collection_date,
          payment_method,
          chit_funds (name, installment_amount),
          cycles (cycle_number, cycle_date),
          members (full_name, phone)
        `)
        .eq('collector_id', collectorId)
        .eq('status', 'pending_close')
        .order('collection_date', { ascending: false })

      if (error) {
        console.error('Error fetching available collections:', error)
        return
      }

      // Map data to match CollectionEntry structure
      const pendingCollections: CollectionEntry[] = (data || []).map(item => ({
        ...item,
        chit_funds: Array.isArray(item.chit_funds) ? item.chit_funds[0] : item.chit_funds,
        cycles: Array.isArray(item.cycles) ? item.cycles[0] : item.cycles,
        members: Array.isArray(item.members) ? item.members[0] : item.members,
      })) as CollectionEntry[]

      // Combine current collections with available ones
      const allCollections = [...currentCollections, ...pendingCollections]
      
      // Remove duplicates based on id
      const uniqueCollections = allCollections.filter((collection, index, self) =>
        index === self.findIndex(c => c.id === collection.id)
      )
      
      setAvailableCollections(uniqueCollections)
      
      // Pre-select currently associated collections
      setSelectedCollections(currentCollections.map(c => c.id))
      
    } catch (error) {
      console.error('Error fetching available collections:', error)
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
      setSelectedCollections(availableCollections.map(c => c.id))
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
      
      // Update closing session
      const { error } = await supabase
        .from('closing_sessions')
        .update({
          session_date: data.sessionDate,
          declared_total: data.declaredTotal,
          system_total: systemTotal,
          entries_count: selectedCollections.length,
          status: isDraft ? 'draft' : 'submitted',
          notes: data.notes,
          submitted_at: isDraft ? null : new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error updating closing session:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update closing session. Please try again."
        })
        return
      }

      // First, remove this closing session from all currently associated collections
      await supabase
        .from('collection_entries')
        .update({ closing_session_id: null })
        .eq('closing_session_id', sessionId)

      // Then, associate the newly selected collections
      const { error: updateError } = await supabase
        .from('collection_entries')
        .update({ closing_session_id: sessionId })
        .in('id', selectedCollections)

      if (updateError) {
        console.error('Error updating collection entries:', updateError)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update collection associations."
        })
        return
      }

      toast({
        title: isDraft ? "Draft updated successfully!" : "Closing session submitted!",
        description: isDraft 
          ? "The closing session has been updated." 
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

  if (pageLoading) {
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
          The closing session you&apos;re looking for doesn&apos;t exist or cannot be edited.
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Closing Session</h1>
            <p className="text-gray-600">
              Modify closing session for {session.profiles.full_name}
            </p>
          </div>
        </div>
        <Badge variant="outline">Draft</Badge>
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
                    Update the session information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Collector (Read-only) */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Collector</label>
                    <div className="mt-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                      {session.profiles.full_name}
                    </div>
                  </div>

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
              {availableCollections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Collections</CardTitle>
                    <CardDescription>
                      Select collections to include in this closing session
                    </CardDescription>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedCollections.length === availableCollections.length && availableCollections.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Select All ({availableCollections.length} collections)
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
                        {availableCollections.map((collection) => (
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

              {availableCollections.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Collections</h3>
                    <p className="text-gray-600">
                      There are no available collections for this collector.
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
                          Update Draft
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
                    Submitting for approval will lock this session from further edits.
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