'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { formatCurrency, cn } from '@/lib/utils'
import { Check, X, Clock, AlertTriangle, TrendingUp, Trophy } from 'lucide-react'

interface Member {
  member: {
    id: string
    full_name: string
    phone?: string
  }
}

interface CollectionEntry {
  id: string
  amount_collected: string
  status: 'pending_close' | 'closed'
  member_id: string
  members: {
    full_name: string
  }
}

interface Cycle {
  id: string
  cycle_number: number
  cycle_date: string
  status: 'upcoming' | 'active' | 'completed'
  winner_member_id?: string
  payout_amount?: string
  collection_entries: CollectionEntry[]
}

interface ChitFund {
  id: string
  name: string
  installment_amount: string
  duration_months: number
}

interface CyclePaymentMatrixProps {
  chitFund: ChitFund
  cycles: Cycle[]
  members: Member[]
}

interface CellData {
  status: 'paid' | 'partial' | 'unpaid' | 'advance' | 'upcoming'
  amount: number
  isWinner?: boolean
}

export function CyclePaymentMatrix({ chitFund, cycles, members }: CyclePaymentMatrixProps) {
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, CellData>>>({})
  const [selectedCell, setSelectedCell] = useState<{ memberId: string; cycleId: string } | null>(null)

  const installmentAmount = parseFloat(chitFund.installment_amount)

  useEffect(() => {
    // Build the payment matrix data
    const matrix: Record<string, Record<string, CellData>> = {}

    members.forEach(member => {
      matrix[member.member.id] = {}
      
      cycles.forEach(cycle => {
        const collectionEntry = cycle.collection_entries?.find(
          entry => entry.member_id === member.member.id && entry.status === 'closed'
        )
        
        const amountPaid = collectionEntry ? parseFloat(collectionEntry.amount_collected) : 0
        const isWinner = cycle.winner_member_id === member.member.id
        
        let status: CellData['status'] = 'unpaid'
        
        if (cycle.status === 'upcoming') {
          status = 'upcoming'
        } else if (amountPaid === 0) {
          status = 'unpaid'
        } else if (amountPaid < installmentAmount) {
          status = 'partial'
        } else if (amountPaid > installmentAmount) {
          status = 'advance'
        } else {
          status = 'paid'
        }
        
        matrix[member.member.id][cycle.id] = {
          status,
          amount: amountPaid,
          isWinner
        }
      })
    })

    setMatrixData(matrix)
  }, [cycles, members, installmentAmount])

  const getCellColor = (cellData: CellData) => {
    if (cellData.isWinner) {
      return 'bg-yellow-100 border-yellow-300 text-yellow-900'
    }
    
    switch (cellData.status) {
      case 'paid':
        return 'bg-green-100 border-green-300 text-green-900'
      case 'advance':
        return 'bg-blue-100 border-blue-300 text-blue-900'
      case 'partial':
        return 'bg-orange-100 border-orange-300 text-orange-900'
      case 'unpaid':
        return 'bg-red-100 border-red-300 text-red-900'
      case 'upcoming':
        return 'bg-gray-100 border-gray-300 text-gray-600'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getCellIcon = (cellData: CellData) => {
    if (cellData.isWinner) {
      return <Trophy className="h-3 w-3" />
    }
    
    switch (cellData.status) {
      case 'paid':
        return <Check className="h-3 w-3" />
      case 'advance':
        return <TrendingUp className="h-3 w-3" />
      case 'partial':
        return <AlertTriangle className="h-3 w-3" />
      case 'unpaid':
        return <X className="h-3 w-3" />
      case 'upcoming':
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  const getMemberStats = (memberId: string) => {
    const memberData = matrixData[memberId] || {}
    const stats = {
      paid: 0,
      partial: 0,
      unpaid: 0,
      advance: 0,
      totalPaid: 0,
      totalExpected: 0
    }
    
    Object.values(memberData).forEach(cell => {
      if (cell.status !== 'upcoming') {
        stats.totalExpected += installmentAmount
        stats.totalPaid += cell.amount
        
        switch (cell.status) {
          case 'paid':
            stats.paid += 1
            break
          case 'partial':
            stats.partial += 1
            break
          case 'unpaid':
            stats.unpaid += 1
            break
          case 'advance':
            stats.advance += 1
            break
        }
      }
    })
    
    return stats
  }

  const getCycleStats = (cycleId: string) => {
    const stats = {
      paid: 0,
      partial: 0,
      unpaid: 0,
      totalCollected: 0,
      totalExpected: installmentAmount * members.length
    }
    
    members.forEach(member => {
      const cellData = matrixData[member.member.id]?.[cycleId]
      if (cellData && cellData.status !== 'upcoming') {
        stats.totalCollected += cellData.amount
        
        switch (cellData.status) {
          case 'paid':
          case 'advance':
            stats.paid += 1
            break
          case 'partial':
            stats.partial += 1
            break
          case 'unpaid':
            stats.unpaid += 1
            break
        }
      }
    })
    
    return stats
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center">
              <Check className="h-2 w-2 text-green-900" />
            </div>
            <span className="text-sm">Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
              <TrendingUp className="h-2 w-2 text-blue-900" />
            </div>
            <span className="text-sm">Advance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded flex items-center justify-center">
              <AlertTriangle className="h-2 w-2 text-orange-900" />
            </div>
            <span className="text-sm">Partial</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
              <X className="h-2 w-2 text-red-900" />
            </div>
            <span className="text-sm">Unpaid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
              <Trophy className="h-2 w-2 text-yellow-900" />
            </div>
            <span className="text-sm">Winner</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
              <Clock className="h-2 w-2 text-gray-600" />
            </div>
            <span className="text-sm">Upcoming</span>
          </div>
        </div>

        {/* Matrix Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="sticky left-0 z-10 bg-white p-4 text-left font-medium border-r">
                        Member
                      </th>
                      {cycles.map(cycle => (
                        <th key={cycle.id} className="p-2 text-center font-medium min-w-[100px]">
                          <div className="space-y-1">
                            <div className="text-sm">
                              Cycle {cycle.cycle_number}
                            </div>
                            <Badge
                              variant={
                                cycle.status === 'completed'
                                  ? 'default'
                                  : cycle.status === 'active'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {cycle.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(cycle.cycle_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            {cycle.status !== 'upcoming' && (
                              <div className="text-xs">
                                {(() => {
                                  const stats = getCycleStats(cycle.id)
                                  const percentage = stats.totalExpected > 0 
                                    ? (stats.totalCollected / stats.totalExpected * 100).toFixed(0)
                                    : '0'
                                  return `${percentage}%`
                                })()}
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-4 text-center font-medium border-l">
                        Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => {
                      const memberStats = getMemberStats(member.member.id)
                      const completionPercentage = memberStats.totalExpected > 0
                        ? (memberStats.totalPaid / memberStats.totalExpected * 100).toFixed(0)
                        : '0'
                      
                      return (
                        <tr key={member.member.id} className="border-b hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-white p-4 border-r">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {member.member.full_name}
                              </div>
                              {member.member.phone && (
                                <div className="text-xs text-muted-foreground">
                                  {member.member.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          {cycles.map(cycle => {
                            const cellData = matrixData[member.member.id]?.[cycle.id]
                            if (!cellData) return <td key={cycle.id} className="p-2" />
                            
                            return (
                              <td key={cycle.id} className="p-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={cn(
                                        "w-full h-16 flex flex-col items-center justify-center space-y-1 border-2",
                                        getCellColor(cellData)
                                      )}
                                      onClick={() => setSelectedCell({ 
                                        memberId: member.member.id, 
                                        cycleId: cycle.id 
                                      })}
                                    >
                                      {getCellIcon(cellData)}
                                      <div className="text-xs font-medium">
                                        {cellData.amount > 0 
                                          ? formatCurrency(cellData.amount)
                                          : cellData.status === 'upcoming' ? '-' : '₹0'
                                        }
                                      </div>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {member.member.full_name} - Cycle {cycle.cycle_number}
                                      </div>
                                      <div>Status: {cellData.status}</div>
                                      <div>Amount: {formatCurrency(cellData.amount)}</div>
                                      <div>Expected: {formatCurrency(installmentAmount)}</div>
                                      {cellData.isWinner && (
                                        <div className="text-yellow-600 font-medium">
                                          🏆 Cycle Winner
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            )
                          })}
                          <td className="p-4 border-l">
                            <div className="space-y-2 text-center">
                              <div className="text-lg font-bold">
                                {completionPercentage}%
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="text-green-600">
                                  ✓ {memberStats.paid} Paid
                                </div>
                                {memberStats.advance > 0 && (
                                  <div className="text-blue-600">
                                    ↗ {memberStats.advance} Advance
                                  </div>
                                )}
                                {memberStats.partial > 0 && (
                                  <div className="text-orange-600">
                                    ⚠ {memberStats.partial} Partial
                                  </div>
                                )}
                                {memberStats.unpaid > 0 && (
                                  <div className="text-red-600">
                                    ✗ {memberStats.unpaid} Unpaid
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(memberStats.totalPaid)} / {formatCurrency(memberStats.totalExpected)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}