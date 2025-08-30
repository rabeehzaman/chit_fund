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
import { ArrowLeft, Download, Filter, Search } from 'lucide-react'
import { SYSTEM_PROFILE_ID } from '@/lib/system'
import { formatCurrency } from '@/lib/utils'
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
  closing_sessions?: {
    status: string | null
    session_date: string
  } | null
  collector: {
    id: string
    full_name: string
  }
}

export default function MyCollectionsPage() {
  const [collections, setCollections] = useState<CollectionEntry[]>([])
  const [filteredCollections, setFilteredCollections] = useState<CollectionEntry[]>([])
  const [collectors, setCollectors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [collectorFilter, setCollectorFilter] = useState<string>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  useEffect(() => {
    fetchCollections()
    fetchCollectors()
  }, [])

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

  const fetchCollections = async () => {
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
          closing_sessions (status, session_date),
          collector:profiles!collector_id (id, full_name)
        `)
        .order('collection_date', { ascending: false })

      if (error) {
        console.error('Error fetching collections:', error)
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
        entry.collector?.full_name.toLowerCase().includes(searchLower) ||
        entry.notes?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter)
    }

    // Collector filter
    if (collectorFilter !== 'all') {
      filtered = filtered.filter(entry => entry.collector?.id === collectorFilter)
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(entry => entry.collection_date >= dateFromFilter)
    }
    if (dateToFilter) {
      filtered = filtered.filter(entry => entry.collection_date <= dateToFilter)
    }

    setFilteredCollections(filtered)
  }, [collections, searchTerm, statusFilter, collectorFilter, dateFromFilter, dateToFilter])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'closed':
        return <Badge className="bg-green-100 text-green-800">Closed</Badge>
      case 'pending_close':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Close</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getPaymentMethodBadge = (method: string | null) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline">Cash</Badge>
      case 'transfer':
        return <Badge variant="outline">Transfer</Badge>
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


  const exportToCSV = () => {
    if (filteredCollections.length === 0) return

    const headers = [
      'Date',
      'Chit Fund',
      'Cycle',
      'Member',
      'Collector',
      'Amount',
      'Payment Method',
      'Status',
      'Notes'
    ]

    const csvData = filteredCollections.map(entry => [
      entry.collection_date,
      entry.chit_funds?.name || '',
      `Cycle ${entry.cycles?.cycle_number || ''}`,
      entry.members?.full_name || '',
      entry.collector?.full_name || '',
      entry.amount_collected,
      entry.payment_method || '',
      entry.status || '',
      entry.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collections-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalAmount = filteredCollections.reduce((sum, entry) => sum + entry.amount_collected, 0)
  const closedCount = filteredCollections.filter(entry => entry.status === 'closed').length
  const pendingCount = filteredCollections.filter(entry => entry.status === 'pending_close').length

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
              <h1 className="text-3xl font-bold text-gray-900">All Collections</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Link href="/dashboard/collect">
                <Button size="sm">Record New Collection</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredCollections.length}</div>
              <div className="text-sm text-gray-600">Total Collections</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending Close</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{closedCount}</div>
              <div className="text-sm text-gray-600">Closed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_close">Pending Close</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by collector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {collectors.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id}>
                      {collector.full_name}
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
              <Input
                type="date"
                placeholder="To date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setCollectorFilter('all')
                  setDateFromFilter('')
                  setDateToFilter('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Collection History</CardTitle>
            <CardDescription>
              All recorded collections from all collectors with filtering and export options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading collections...</div>
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No collections found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Chit Fund</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
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
                        <TableCell>
                          <div className="font-medium text-blue-600">
                            {entry.collector?.full_name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.amount_collected)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(entry.payment_method)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(entry.status)}
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
