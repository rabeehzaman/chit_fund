'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Download, 
  RefreshCw, 
  Database,
  Users,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { HierarchicalMasterTable } from './master-table-hierarchical'
import { FundWithStats } from '@/lib/services/master-table-data'
import { formatCurrency } from '@/lib/utils'

export interface HierarchicalMasterData {
  funds: FundWithStats[]
  totalFunds: number
  activeFunds: number
  totalMembers: number
  totalCollected: number
  totalValue: number
}

interface MasterTableClientProps {
  initialData: HierarchicalMasterData
}

export function MasterTableClient({ initialData }: MasterTableClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [data, setData] = useState(initialData)

  // Persist open state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('masterTableOpen')
    if (stored) {
      setIsOpen(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('masterTableOpen', JSON.stringify(isOpen))
  }, [isOpen])

  // Auto-refresh every 30 seconds when open
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLastRefresh(new Date())
        // Trigger data refresh here
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const handleRefresh = () => {
    setIsLoading(true)
    setLastRefresh(new Date())
    // Implement data refresh
    setTimeout(() => setIsLoading(false), 1000) // Mock loading
  }

  const handleExportCSV = () => {
    const currentDate = new Date().toISOString().split('T')[0]
    const fileName = `hierarchical-master-data-${currentDate}.csv`
    
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Level,Fund Name,Member Name,Item Details,Amount,Status,Date,Notes\n'
    
    // Export hierarchical data in a flattened format
    data.funds.forEach(fund => {
      // Fund level row
      csvContent += `Fund,"${fund.name}","","${fund.members} members, ${fund.collectionProgress.toFixed(1)}% progress",${fund.totalValue},"${fund.status}","${fund.startDate}","${fund.recentActivity || ''}"\n`
    })
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('Exported hierarchical CSV data')
  }

  const scrollToTable = () => {
    if (!isOpen) {
      setIsOpen(true)
      // Small delay to allow collapsible to open
      setTimeout(() => {
        document.getElementById('master-table')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }, 150)
    }
  }

  return (
    <div id="master-table" className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl">Hierarchical Master Data</CardTitle>
                    <CardDescription>
                      Drill down from funds → members → payments - {isOpen ? 'Click to collapse' : 'Click to expand'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isOpen && (
                    <Badge variant="secondary" className="hidden sm:flex">
                      {data.totalFunds} Funds • {data.totalMembers} Members • {formatCurrency(data.totalCollected)} Collected
                    </Badge>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4">
                {/* Stats Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.totalFunds}</div>
                    <div className="text-sm text-muted-foreground">Total Funds</div>
                    <div className="text-xs text-green-600">{data.activeFunds} active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{data.totalMembers}</div>
                    <div className="text-sm text-muted-foreground">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalCollected)}</div>
                    <div className="text-sm text-muted-foreground">Total Collected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {data.totalValue > 0 ? `${(data.totalCollected / data.totalValue * 100).toFixed(1)}%` : '0%'}
                    </div>
                    <div className="text-sm text-muted-foreground">Collection Rate</div>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Search Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search funds, members, or activity..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground self-center">
                    💡 Tip: Expand funds to see members, then members to see their payments
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <HierarchicalMasterTable 
                funds={data.funds}
                searchTerm={searchTerm}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}