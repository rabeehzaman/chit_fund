'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowUpDown,
  Eye,
  FileText
} from 'lucide-react'
// import { format } from 'date-fns'

interface CashbookEntry {
  id: string
  chit_fund_id: string
  transaction_date: string
  transaction_time: string
  transaction_type: 'cash_in' | 'cash_out'
  amount: number
  running_balance: number
  payment_method: string
  transaction_description: string
  notes: string | null
  receipt_number: string | null
  reference_number: string | null
  status: 'confirmed' | 'pending' | 'cancelled'
  member_name: string
  member_phone: string | null
  fund_name: string
  cycle_number: number | null
  collector_name: string | null
  processed_by_name: string | null
  closing_session_date: string | null
  payout_date: string | null
  created_at: string
}

interface ChitFund {
  id: string
  name: string
}

interface DailySummary {
  transaction_date: string
  total_cash_in: number
  total_cash_out: number
  net_cash_flow: number
  cash_in_transactions: number
  cash_out_transactions: number
  total_transactions: number
}

export default function CashbookPage() {
  const [entries, setEntries] = useState<CashbookEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<CashbookEntry[]>([])
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([])
  const [chitFunds, setChitFunds] = useState<ChitFund[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFund, setSelectedFund] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedMethod, setSelectedMethod] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState('transaction_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [entries, searchTerm, selectedFund, selectedType, selectedStatus, selectedMethod, dateFrom, dateTo, sortField, sortDirection])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch cashbook entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('cashbook_consolidated_view')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('transaction_time', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (entriesError) throw entriesError
      setEntries(entriesData || [])
      
      // Fetch daily summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('daily_cashbook_summary')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(30)
      
      if (summaryError) throw summaryError
      setDailySummary(summaryData || [])
      
      // Fetch chit funds for filter
      const { data: fundsData, error: fundsError } = await supabase
        .from('chit_funds')
        .select('id, name')
        .order('name')
      
      if (fundsError) throw fundsError
      setChitFunds(fundsData || [])
      
    } catch (error) {
      console.error('Error fetching cashbook data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...entries]
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.member_name.toLowerCase().includes(searchLower) ||
        entry.fund_name.toLowerCase().includes(searchLower) ||
        entry.transaction_description.toLowerCase().includes(searchLower) ||
        entry.collector_name?.toLowerCase().includes(searchLower) ||
        entry.receipt_number?.toLowerCase().includes(searchLower) ||
        entry.reference_number?.toLowerCase().includes(searchLower)
      )
    }
    
    // Fund filter
    if (selectedFund !== 'all') {
      filtered = filtered.filter(entry => entry.chit_fund_id === selectedFund)
    }
    
    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(entry => entry.transaction_type === selectedType)
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === selectedStatus)
    }
    
    // Payment method filter
    if (selectedMethod !== 'all') {
      filtered = filtered.filter(entry => entry.payment_method === selectedMethod)
    }
    
    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(entry => entry.transaction_date >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(entry => entry.transaction_date <= dateTo)
    }
    
    // Sorting - default to latest first (newest at top)
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof CashbookEntry]
      let bVal: any = b[sortField as keyof CashbookEntry]
      
      if (sortField === 'amount' || sortField === 'running_balance') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      }
      
      // For date sorting, also consider time to ensure proper chronological order
      if (sortField === 'transaction_date') {
        const aDateTime = new Date(`${a.transaction_date}T${a.transaction_time}`)
        const bDateTime = new Date(`${b.transaction_date}T${b.transaction_time}`)
        
        if (sortDirection === 'asc') {
          return aDateTime.getTime() - bDateTime.getTime()
        } else {
          return bDateTime.getTime() - aDateTime.getTime()
        }
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
    
    setFilteredEntries(filtered)
  }

  const getTotalSummary = () => {
    const totalCashIn = filteredEntries
      .filter(e => e.transaction_type === 'cash_in')
      .reduce((sum, e) => sum + e.amount, 0)
    
    const totalCashOut = filteredEntries
      .filter(e => e.transaction_type === 'cash_out')
      .reduce((sum, e) => sum + e.amount, 0)
    
    return {
      totalCashIn,
      totalCashOut,
      netFlow: totalCashIn - totalCashOut,
      totalTransactions: filteredEntries.length,
      cashInCount: filteredEntries.filter(e => e.transaction_type === 'cash_in').length,
      cashOutCount: filteredEntries.filter(e => e.transaction_type === 'cash_out').length
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    return type === 'cash_in' ? 'Cash In' : 'Cash Out'
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Date', 'Time', 'Type', 'Amount', 'Running Balance', 'Member', 'Fund', 
      'Collector', 'Payment Method', 'Description', 'Receipt No', 'Status'
    ]
    
    const csvData = filteredEntries.map(entry => [
      entry.transaction_date,
      entry.transaction_time,
      getTransactionTypeLabel(entry.transaction_type),
      entry.amount,
      entry.running_balance,
      entry.member_name,
      entry.fund_name,
      entry.collector_name || 'N/A',
      entry.payment_method,
      entry.transaction_description,
      entry.receipt_number || 'N/A',
      entry.status
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cashbook-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const summary = getTotalSummary()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cashbook...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cashbook</h1>
          <p className="text-muted-foreground">
            Complete ledger of all cash movements in and out
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalCashIn)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.cashInCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalCashOut)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.cashOutCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(summary.netFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalTransactions} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger>
                <SelectValue placeholder="All Funds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {chitFunds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cash_in">Cash In</SelectItem>
                <SelectItem value="cash_out">Cash Out</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cashbook Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Cashbook Ledger
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredEntries.length} entries
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortField('transaction_date')
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      Date <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[90px]">Type</TableHead>
                  <TableHead className="w-[110px] text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSortField('amount')
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      }}
                    >
                      Amount <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Balance</TableHead>
                  <TableHead className="w-[150px]">Member</TableHead>
                  <TableHead className="w-[120px]">Fund</TableHead>
                  <TableHead className="w-[100px]">Collector</TableHead>
                  <TableHead className="w-[100px]">Method</TableHead>
                  <TableHead className="w-[400px]">Description</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.transaction_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.transaction_time.substring(0, 5)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={entry.transaction_type === 'cash_in' ? 'default' : 'secondary'}
                        className={entry.transaction_type === 'cash_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {getTransactionTypeLabel(entry.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      entry.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.transaction_type === 'cash_in' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(entry.running_balance)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.member_name}</div>
                        {entry.member_phone && (
                          <div className="text-xs text-muted-foreground">{entry.member_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{entry.fund_name}</div>
                      {entry.cycle_number && (
                        <div className="text-xs text-muted-foreground">Cycle {entry.cycle_number}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{entry.collector_name || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[400px] whitespace-normal leading-tight">
                        {entry.transaction_description}
                      </div>
                      {entry.receipt_number && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Receipt: {entry.receipt_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cashbook entries found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}