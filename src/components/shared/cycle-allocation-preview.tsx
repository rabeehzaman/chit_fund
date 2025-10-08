'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import { getAllocatedCycles, getMemberPaymentSummary } from '@/lib/payment-utils'
import type { CycleAllocation, MemberPaymentSummary } from '@/lib/payment-utils'
import { formatCurrency } from '@/lib/utils'

interface CycleAllocationPreviewProps {
  memberId: string | null
  chitFundId: string | null
  paymentAmount: number
}

export function CycleAllocationPreview({
  memberId,
  chitFundId,
  paymentAmount
}: CycleAllocationPreviewProps) {
  const [allocations, setAllocations] = useState<CycleAllocation[]>([])
  const [summary, setSummary] = useState<MemberPaymentSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllocation = async () => {
      if (!memberId || !chitFundId || paymentAmount <= 0) {
        setAllocations([])
        setSummary(null)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get member payment summary
        const summaryData = await getMemberPaymentSummary(memberId, chitFundId)
        setSummary(summaryData)

        // Get cycle allocations
        const allocationData = await getAllocatedCycles(memberId, chitFundId, paymentAmount)
        setAllocations(allocationData)
      } catch (err: any) {
        console.error('Error fetching allocation:', err)
        setError(err.message || 'Unable to calculate payment allocation')
        setAllocations([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllocation()
  }, [memberId, chitFundId, paymentAmount])

  if (!memberId || !chitFundId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Allocation</CardTitle>
          <CardDescription>Select member and chit fund to see allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select a member and chit fund first
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Calculating allocation...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Allocation</CardTitle>
        <CardDescription>
          {paymentAmount > 0
            ? 'How your payment will be distributed'
            : 'Enter an amount to see allocation'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member Summary */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Obligation:</span>
            <span className="font-medium">{formatCurrency(summary.totalObligation)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Already Paid:</span>
            <span className="font-medium text-green-600">{formatCurrency(summary.totalPaid)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining:</span>
            <span className="font-medium text-orange-600">{formatCurrency(summary.totalRemaining)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground pt-2">
            <span>
              {summary.cyclesFullyPaid} paid · {summary.cyclesPartiallyPaid} partial · {summary.cyclesUnpaid} unpaid
            </span>
          </div>
        </div>

        {/* Payment Amount Validation */}
        {paymentAmount > 0 && (
          <>
            {paymentAmount > summary.totalRemaining && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment amount ({formatCurrency(paymentAmount)}) exceeds remaining obligation ({formatCurrency(summary.totalRemaining)})
                </AlertDescription>
              </Alert>
            )}

            {summary.totalRemaining === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  All cycles are fully paid. No payment needed.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Cycle Allocations */}
        {paymentAmount > 0 && allocations.length > 0 && (
          <div className="space-y-3">
            {/* Summary Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Covering {allocations.length} Cycle{allocations.length > 1 ? 's' : ''}</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(paymentAmount)}
                </span>
              </div>
              <div className="mt-1 text-xs text-blue-700">
                {allocations.filter(a => a.paymentStatus === 'fully_paid').length > 0 && (
                  <span>{allocations.filter(a => a.paymentStatus === 'fully_paid').length} complete</span>
                )}
                {allocations.filter(a => a.paymentStatus === 'partially_paid').length > 0 && (
                  <span className="ml-2">{allocations.filter(a => a.paymentStatus === 'partially_paid').length} partial</span>
                )}
              </div>
            </div>

            {/* Compact Cycle List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {allocations.map((allocation, index) => (
                <div
                  key={allocation.cycleId}
                  className={`border rounded-md p-2.5 ${
                    allocation.paymentStatus === 'fully_paid'
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current text-xs font-bold">
                        {allocation.cycleNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Cycle {allocation.cycleNumber}
                          </span>
                          {allocation.paymentStatus === 'fully_paid' && (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(allocation.cycleDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600 text-sm">
                        {formatCurrency(allocation.allocatedAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(allocation.alreadyPaid + allocation.allocatedAmount)} / {formatCurrency(allocation.installmentAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Compact Progress Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          allocation.paymentStatus === 'fully_paid'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(100, ((allocation.alreadyPaid + allocation.allocatedAmount) / allocation.installmentAmount) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Hint */}
            {allocations.length > 4 && (
              <div className="text-xs text-center text-muted-foreground">
                Scroll to see all {allocations.length} cycles
              </div>
            )}
          </div>
        )}

        {paymentAmount === 0 && (
          <div className="text-center text-muted-foreground py-4 text-sm">
            Enter a payment amount to see how it will be allocated
          </div>
        )}
      </CardContent>
    </Card>
  )
}
