'use client'

import { useState, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  AnimatedTable, 
  AnimatedTableBody, 
  AnimatedTableCell, 
  AnimatedTableHeader, 
  AnimatedTableRow,
  TableSkeleton
} from '@/components/ui/animated-table'
import { TableHead } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Phone,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText
} from 'lucide-react'
import { 
  FundWithStats, 
  FundMemberData, 
  MemberCollectionData, 
  fetchFundMembers, 
  fetchMemberCollections 
} from '@/lib/services/master-table-data'

interface HierarchicalMasterTableProps {
  funds: FundWithStats[]
  searchTerm: string
  isLoading: boolean
}

interface ExpandedState {
  funds: Set<string>
  members: Set<string>
}

interface LoadingState {
  members: Set<string>
  collections: Set<string>
}

interface CachedData {
  members: Record<string, FundMemberData[]>
  collections: Record<string, MemberCollectionData[]>
}

export function HierarchicalMasterTable({ funds, searchTerm, isLoading }: HierarchicalMasterTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({
    funds: new Set(),
    members: new Set()
  })
  const [loading, setLoading] = useState<LoadingState>({
    members: new Set(),
    collections: new Set()
  })
  const [cachedData, setCachedData] = useState<CachedData>({
    members: {},
    collections: {}
  })
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Filter funds based on search term
  const filteredFunds = useMemo(() => {
    if (!searchTerm) return funds

    const searchLower = searchTerm.toLowerCase()
    return funds.filter(fund =>
      fund.name.toLowerCase().includes(searchLower) ||
      fund.status.toLowerCase().includes(searchLower) ||
      fund.recentActivity?.toLowerCase().includes(searchLower)
    )
  }, [funds, searchTerm])

  const toggleFundExpansion = useCallback(async (fundId: string) => {
    const newExpanded = new Set(expanded.funds)
    
    if (newExpanded.has(fundId)) {
      // Collapse - remove fund and all its members from expanded state
      newExpanded.delete(fundId)
      const membersToRemove = new Set(
        [...expanded.members].filter(memberKey => memberKey.startsWith(fundId))
      )
      const newExpandedMembers = new Set([...expanded.members].filter(memberKey => !memberKey.startsWith(fundId)))
      
      setExpanded({
        funds: newExpanded,
        members: newExpandedMembers
      })
    } else {
      // Expand - add fund and load members if not cached
      newExpanded.add(fundId)
      setExpanded(prev => ({ ...prev, funds: newExpanded }))
      
      if (!cachedData.members[fundId]) {
        const newLoadingMembers = new Set(loading.members)
        newLoadingMembers.add(fundId)
        setLoading(prev => ({ ...prev, members: newLoadingMembers }))
        
        try {
          const members = await fetchFundMembers(fundId)
          setCachedData(prev => ({
            ...prev,
            members: { ...prev.members, [fundId]: members }
          }))
        } catch (error) {
          console.error('Error loading members:', error)
        } finally {
          const updatedLoadingMembers = new Set(loading.members)
          updatedLoadingMembers.delete(fundId)
          setLoading(prev => ({ ...prev, members: updatedLoadingMembers }))
        }
      }
    }
  }, [expanded, loading, cachedData])

  const toggleMemberExpansion = useCallback(async (fundId: string, memberId: string) => {
    const memberKey = `${fundId}-${memberId}`
    const newExpandedMembers = new Set(expanded.members)
    
    if (newExpandedMembers.has(memberKey)) {
      newExpandedMembers.delete(memberKey)
    } else {
      newExpandedMembers.add(memberKey)
      
      // Load collections if not cached
      const collectionKey = memberKey
      if (!cachedData.collections[collectionKey]) {
        const newLoadingCollections = new Set(loading.collections)
        newLoadingCollections.add(collectionKey)
        setLoading(prev => ({ ...prev, collections: newLoadingCollections }))
        
        try {
          const collections = await fetchMemberCollections(fundId, memberId)
          setCachedData(prev => ({
            ...prev,
            collections: { ...prev.collections, [collectionKey]: collections }
          }))
        } catch (error) {
          console.error('Error loading collections:', error)
        } finally {
          const updatedLoadingCollections = new Set(loading.collections)
          updatedLoadingCollections.delete(collectionKey)
          setLoading(prev => ({ ...prev, collections: updatedLoadingCollections }))
        }
      }
    }
    
    setExpanded(prev => ({ ...prev, members: newExpandedMembers }))
  }, [expanded, loading, cachedData])

  const getStatusBadge = (status: string, context: 'fund' | 'member' | 'collection' = 'fund') => {
    const statusConfig = {
      'active': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'inactive': { variant: 'secondary' as const, icon: XCircle, color: 'text-gray-600' },
      'pending': { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
      'CLOSED': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'PENDING': { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
      'completed': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: 'secondary' as const, 
      icon: AlertTriangle, 
      color: 'text-gray-600' 
    }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  const toggleRowSelection = useCallback((id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }, [selectedRows])

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredFunds.length} fund{filteredFunds.length !== 1 ? 's' : ''} with hierarchical data
        </p>
        <div className="text-sm text-muted-foreground">
          {expanded.funds.size > 0 && `${expanded.funds.size} fund${expanded.funds.size !== 1 ? 's' : ''} expanded`}
        </div>
      </div>

      <AnimatedTable>
        <AnimatedTableHeader>
          <AnimatedTableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRows.size > 0}
                onCheckedChange={() => setSelectedRows(new Set())}
              />
            </TableHead>
            <TableHead className="w-12"></TableHead> {/* Expand/Collapse */}
            <TableHead>Name / Details</TableHead>
            <TableHead>Progress / Status</TableHead>
            <TableHead className="text-right">Members / Amount</TableHead>
            <TableHead className="text-right">Collected / Paid</TableHead>
            <TableHead className="text-right">Target / Due</TableHead>
            <TableHead>Status / Last Activity</TableHead>
          </AnimatedTableRow>
        </AnimatedTableHeader>
        <AnimatedTableBody>
          {filteredFunds.map((fund) => (
            <>
              {/* Fund Row */}
              <AnimatedTableRow 
                key={fund.id} 
                className="bg-slate-50/50 font-medium border-l-4 border-l-blue-500"
              >
                <AnimatedTableCell>
                  <Checkbox
                    checked={selectedRows.has(fund.id)}
                    onCheckedChange={() => toggleRowSelection(fund.id)}
                  />
                </AnimatedTableCell>
                <AnimatedTableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleFundExpansion(fund.id)}
                  >
                    {expanded.funds.has(fund.id) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                </AnimatedTableCell>
                <AnimatedTableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{fund.name}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(fund.startDate)} • {fund.duration} months
                    </div>
                  </div>
                </AnimatedTableCell>
                <AnimatedTableCell>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{fund.collectionProgress.toFixed(1)}%</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(fund.collected)} / {formatCurrency(fund.totalValue)}
                      </span>
                    </div>
                    <Progress value={fund.collectionProgress} className="w-full" />
                  </div>
                </AnimatedTableCell>
                <AnimatedTableCell className="text-right">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{fund.members}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fund.installment > 0 && `${formatCurrency(fund.installment)}/month`}
                    </div>
                  </div>
                </AnimatedTableCell>
                <AnimatedTableCell className="text-right">
                  <div className="flex flex-col">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(fund.collected)}
                    </span>
                    {fund.arrearsCount > 0 && (
                      <div className="flex items-center justify-end gap-1 text-sm text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {fund.arrearsCount} arrears
                      </div>
                    )}
                  </div>
                </AnimatedTableCell>
                <AnimatedTableCell className="text-right">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatCurrency(fund.totalValue)}
                    </span>
                    {fund.remaining > 0 && (
                      <span className="text-sm text-orange-600">
                        {formatCurrency(fund.remaining)} remaining
                      </span>
                    )}
                  </div>
                </AnimatedTableCell>
                <AnimatedTableCell>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(fund.status)}
                    {fund.advancesCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {fund.advancesCount} advances
                      </div>
                    )}
                  </div>
                </AnimatedTableCell>
              </AnimatedTableRow>

              {/* Fund Members */}
              {expanded.funds.has(fund.id) && (
                <>
                  {loading.members.has(fund.id) ? (
                    <AnimatedTableRow>
                      <AnimatedTableCell colSpan={8} className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                          Loading members...
                        </div>
                      </AnimatedTableCell>
                    </AnimatedTableRow>
                  ) : (
                    cachedData.members[fund.id]?.map((member) => (
                      <>
                        {/* Member Row */}
                        <AnimatedTableRow 
                          key={`${fund.id}-${member.id}`}
                          className="bg-blue-50/30 border-l-4 border-l-indigo-300"
                        >
                          <AnimatedTableCell className="pl-6">
                            <Checkbox
                              checked={selectedRows.has(`${fund.id}-${member.id}`)}
                              onCheckedChange={() => toggleRowSelection(`${fund.id}-${member.id}`)}
                            />
                          </AnimatedTableCell>
                          <AnimatedTableCell className="pl-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleMemberExpansion(fund.id, member.id)}
                            >
                              {expanded.members.has(`${fund.id}-${member.id}`) ? 
                                <ChevronDown className="h-4 w-4 text-indigo-600" /> : 
                                <ChevronRight className="h-4 w-4 text-indigo-600" />
                              }
                            </Button>
                          </AnimatedTableCell>
                          <AnimatedTableCell className="pl-2">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-600" />
                                <span className="font-medium text-slate-800">{member.name}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </div>
                              )}
                            </div>
                          </AnimatedTableCell>
                          <AnimatedTableCell>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">
                                {member.paymentsCount} payment{member.paymentsCount !== 1 ? 's' : ''} made
                              </div>
                              {member.lastPayment && (
                                <div className="text-xs text-muted-foreground">
                                  Last: {formatDate(member.lastPayment)}
                                </div>
                              )}
                            </div>
                          </AnimatedTableCell>
                          <AnimatedTableCell className="text-right">
                            <span className="font-medium">Member</span>
                          </AnimatedTableCell>
                          <AnimatedTableCell className="text-right">
                            <div className="flex flex-col">
                              <span className="font-semibold text-green-600">
                                {formatCurrency(member.totalPaid)}
                              </span>
                              {member.arrears > 0 && (
                                <span className="text-sm text-red-600">
                                  -{formatCurrency(member.arrears)} arrears
                                </span>
                              )}
                            </div>
                          </AnimatedTableCell>
                          <AnimatedTableCell className="text-right">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatCurrency(member.totalDue)}
                              </span>
                              {member.advances > 0 && (
                                <span className="text-sm text-green-600">
                                  +{formatCurrency(member.advances)} advance
                                </span>
                              )}
                            </div>
                          </AnimatedTableCell>
                          <AnimatedTableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(member.status, 'member')}
                              {member.nextDueAmount > 0 && (
                                <div className="text-xs text-orange-600">
                                  Next: {formatCurrency(member.nextDueAmount)}
                                </div>
                              )}
                            </div>
                          </AnimatedTableCell>
                        </AnimatedTableRow>

                        {/* Member Collections */}
                        {expanded.members.has(`${fund.id}-${member.id}`) && (
                          <>
                            {loading.collections.has(`${fund.id}-${member.id}`) ? (
                              <AnimatedTableRow>
                                <AnimatedTableCell colSpan={8} className="text-center py-3 pl-16">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-indigo-600"></div>
                                    Loading payments...
                                  </div>
                                </AnimatedTableCell>
                              </AnimatedTableRow>
                            ) : (
                              cachedData.collections[`${fund.id}-${member.id}`]?.map((collection) => (
                                <AnimatedTableRow 
                                  key={collection.id}
                                  className="bg-indigo-50/50 border-l-4 border-l-purple-200"
                                >
                                  <AnimatedTableCell className="pl-12">
                                    <Checkbox
                                      checked={selectedRows.has(collection.id)}
                                      onCheckedChange={() => toggleRowSelection(collection.id)}
                                    />
                                  </AnimatedTableCell>
                                  <AnimatedTableCell className="pl-12">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                  </AnimatedTableCell>
                                  <AnimatedTableCell className="pl-2">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-purple-600" />
                                        <span className="font-medium text-slate-700">
                                          {formatDate(collection.date)}
                                        </span>
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Cycle {collection.cycleNumber} • {collection.method}
                                      </div>
                                    </div>
                                  </AnimatedTableCell>
                                  <AnimatedTableCell>
                                    <div className="space-y-1">
                                      <div className="text-sm text-muted-foreground">
                                        Collected by {collection.collector}
                                      </div>
                                      {collection.closingSession && (
                                        <Badge variant="outline" className="text-xs">
                                          {collection.closingSession}
                                        </Badge>
                                      )}
                                    </div>
                                  </AnimatedTableCell>
                                  <AnimatedTableCell className="text-right">
                                    <span className="text-sm text-muted-foreground">Payment</span>
                                  </AnimatedTableCell>
                                  <AnimatedTableCell className="text-right">
                                    <span className="font-semibold text-purple-600">
                                      {formatCurrency(collection.amount)}
                                    </span>
                                  </AnimatedTableCell>
                                  <AnimatedTableCell className="text-right">
                                    <Badge variant="outline" className="text-xs">
                                      {collection.method.toUpperCase()}
                                    </Badge>
                                  </AnimatedTableCell>
                                  <AnimatedTableCell>
                                    <div className="flex flex-col gap-1">
                                      {getStatusBadge(collection.status, 'collection')}
                                      {collection.notes && (
                                        <div className="text-xs text-muted-foreground truncate max-w-32">
                                          {collection.notes}
                                        </div>
                                      )}
                                    </div>
                                  </AnimatedTableCell>
                                </AnimatedTableRow>
                              ))
                            )}
                          </>
                        )}
                      </>
                    ))
                  )}
                </>
              )}
            </>
          ))}
        </AnimatedTableBody>
      </AnimatedTable>

      {filteredFunds.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p>No funds found matching your search criteria</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search terms</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}