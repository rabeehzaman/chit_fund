'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Filter, Search, Users, DollarSign, Calendar, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type PendingCollection = Tables<'collection_entries'> & {
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
  profiles: {
    full_name: string | null
    role: string | null
  }
}

interface CollectorSummary {
  collector_id: string
  collector_name: string
  total_amount: number
  entry_count: number
  oldest_date: string
}

export default function PendingCollectionsPage() {
  const [collections, setCollections] = useState<PendingCollection[]>([])
  const [filteredCollections, setFilteredCollections] = useState<PendingCollection[]>([])
  const [collectorSummaries, setCollectorSummaries] = useState<CollectorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [collectorFilter, setCollectorFilter] = useState<string>('all')
  const [chitFundFilter, setChitFundFilter] = useState<string>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')

  useEffect(() => {
    fetchPendingCollections()
  }, [])

  const fetchPendingCollections = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('collection_entries')
        .select(`
          *,
          chit_funds (name, installment_amount),
          cycles (cycle_number, cycle_date),
          members (full_name, phone),
          profiles (full_name, role)
        `)
        .eq('status', 'pending_close')
        .order('collection_date', { ascending: false })

      if (error) {
        console.error('Error fetching pending collections:', error)
        return
      }

      setCollections(data || [])
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = collections

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.members?.full_name.toLowerCase().includes(searchLower) ||
        entry.chit_funds?.name.toLowerCase().includes(searchLower) ||
        entry.profiles?.full_name?.toLowerCase().includes(searchLower) ||
        entry.notes?.toLowerCase().includes(searchLower)
      )
    }

    // Collector filter
    if (collectorFilter !== 'all') {
      filtered = filtered.filter(entry => entry.collector_id === collectorFilter)
    }

    // Chit fund filter
    if (chitFundFilter !== 'all') {
      filtered = filtered.filter(entry => entry.chit_fund_id === chitFundFilter)
    }

    // Date from filter
    if (dateFromFilter) {
      filtered = filtered.filter(entry => entry.collection_date >= dateFromFilter)
    }

    setFilteredCollections(filtered)
  }, [collections, searchTerm, collectorFilter, chitFundFilter, dateFromFilter])

  const generateCollectorSummaries = useCallback(() => {
    const summaryMap: { [key: string]: CollectorSummary } = {}

    filteredCollections.forEach(entry => {
      const collectorId = entry.collector_id
      if (!summaryMap[collectorId]) {
        summaryMap[collectorId] = {
          collector_id: collectorId,
          collector_name: entry.profiles?.full_name || 'Unknown Collector',
          total_amount: 0,
          entry_count: 0,
          oldest_date: entry.collection_date
        }
      }

      const summary = summaryMap[collectorId]
      summary.total_amount += entry.amount_collected
      summary.entry_count += 1
      
      if (entry.collection_date < summary.oldest_date) {
        summary.oldest_date = entry.collection_date
      }
    })

    setCollectorSummaries(Object.values(summaryMap))
  }, [filteredCollections])

  useEffect(() => {
    applyFilters()
    generateCollectorSummaries()
  }, [applyFilters, generateCollectorSummaries])

  const getPaymentMethodBadge = (method: string | null) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Cash</Badge>
      case 'transfer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Transfer</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }


  const getUniqueCollectors = () => {
    const collectors = new Map()
    collections.forEach(entry => {
      collectors.set(entry.collector_id, entry.profiles?.full_name || 'Unknown')
    })
    return Array.from(collectors.entries()).map(([id, name]) => ({ id, name }))
  }

  const getUniqueChitFunds = () => {
    const chitFunds = new Map()
    collections.forEach(entry => {
      chitFunds.set(entry.chit_fund_id, entry.chit_funds?.name || 'Unknown')
    })
    return Array.from(chitFunds.entries()).map(([id, name]) => ({ id, name }))
  }

  const totalAmount = filteredCollections.reduce((sum, entry) => sum + entry.amount_collected, 0)
  const uniqueCollectors = new Set(filteredCollections.map(entry => entry.collector_id)).size
  const uniqueMembers = new Set(filteredCollections.map(entry => entry.member_id)).size

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Pending Collections</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Create Closing Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-orange-600">{filteredCollections.length}</div>
                  <div className="text-sm text-gray-600">Pending Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-blue-600">{uniqueCollectors}</div>
                  <div className="text-sm text-gray-600">Active Collectors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold text-purple-600">{uniqueMembers}</div>
                  <div className="text-sm text-gray-600">Unique Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collector Summaries */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Collector Summaries</CardTitle>
            <CardDescription>
              Overview of pending collections by collector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collectorSummaries.map((summary) => (
                <div key={summary.collector_id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="font-medium text-lg">{summary.collector_name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {summary.entry_count} entries • {formatCurrency(summary.total_amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Oldest: {formatDate(summary.oldest_date)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by collector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {getUniqueCollectors().map(collector => (
                    <SelectItem key={collector.id} value={collector.id}>
                      {collector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chitFundFilter} onValueChange={setChitFundFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by chit fund" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chit Funds</SelectItem>
                  {getUniqueChitFunds().map(fund => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setCollectorFilter('all')
                  setChitFundFilter('all')
                  setDateFromFilter('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Pending Collections</CardTitle>
            <CardDescription>
              Collection entries awaiting closure and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading pending collections...</div>
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending collections found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Chit Fund</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollections.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {formatDate(entry.collection_date)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.profiles?.full_name || 'Unknown'}</div>
                          <Badge variant="outline" className="text-xs">
                            {entry.profiles?.role || 'admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.chit_funds?.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(entry.chit_funds?.installment_amount || 0)} installment
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>Cycle {entry.cycles?.cycle_number}</div>
                            <div className="text-sm text-gray-500">
                              {entry.cycles?.cycle_date ? formatDate(entry.cycles.cycle_date) : ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.members?.full_name}</div>
                            {entry.members?.phone && (
                              <div className="text-sm text-gray-500">{entry.members.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.amount_collected)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(entry.payment_method)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}