'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { calculatePaymentLimits, calculatePaymentBreakdown, getPaymentMessage } from '@/lib/payment-utils'
import { formatCurrency } from '@/lib/utils'
import { Calculator, TrendingUp, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react'
import type { PaymentLimits, PaymentBreakdown } from '@/lib/payment-utils'

interface PaymentPreviewProps {
  memberId: string | null
  chitFundId: string | null
  paymentAmount: number
}

export function PaymentPreview({ memberId, chitFundId, paymentAmount }: PaymentPreviewProps) {
  const [limits, setLimits] = useState<PaymentLimits | null>(null)
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchLimits = async () => {
      if (!memberId || !chitFundId) {
        setLimits(null)
        setBreakdown(null)
        return
      }

      setLoading(true)
      try {
        const paymentLimits = await calculatePaymentLimits(memberId, chitFundId)
        setLimits(paymentLimits)
        
        if (paymentLimits && paymentAmount > 0) {
          const paymentBreakdown = calculatePaymentBreakdown(paymentAmount, paymentLimits)
          setBreakdown(paymentBreakdown)
        } else {
          setBreakdown(null)
        }
      } catch (error) {
        console.error('Error fetching payment limits:', error)
        setLimits(null)
        setBreakdown(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLimits()
  }, [memberId, chitFundId, paymentAmount])

  if (!memberId || !chitFundId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <span>Payment Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Select a member to see payment details
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <span>Payment Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading payment details...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <span>Payment Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Unable to load payment details
          </div>
        </CardContent>
      </Card>
    )
  }

  const message = paymentAmount > 0 ? getPaymentMessage(paymentAmount, limits) : null
  
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'info':
        return Info
      case 'warning':
        return AlertCircle
      case 'error':
        return AlertCircle
      default:
        return Info
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment Limits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            <span>Payment Limits</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Minimum Payment</div>
              <div className="font-semibold text-red-600">
                {formatCurrency(limits.minimum)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Maximum Payment</div>
              <div className="font-semibold text-green-600">
                {formatCurrency(limits.maximum)}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span>Total Obligation:</span>
              <span className="font-medium">{formatCurrency(limits.totalObligation)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Already Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(limits.totalPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
              <span>Remaining:</span>
              <span className="text-orange-600">{formatCurrency(limits.remainingObligation)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{((limits.totalPaid / limits.totalObligation) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={(limits.totalPaid / limits.totalObligation) * 100} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {(() => {
            const IconComponent = getMessageIcon(message.type)
            return <IconComponent className="h-4 w-4" />
          })()}
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}

      {/* Payment Breakdown */}
      {breakdown && paymentAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Payment Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Current Cycle</div>
                <div className="font-semibold">
                  {formatCurrency(breakdown.currentCycle)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Advance Amount</div>
                <div className="font-semibold text-blue-600">
                  {formatCurrency(breakdown.advanceAmount)}
                </div>
              </div>
            </div>

            {breakdown.cyclesCovered > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cycles Covered:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {breakdown.cyclesCovered} future cycle{breakdown.cyclesCovered !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Remaining After Payment:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(breakdown.remainingAfterPayment)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Completion Progress</span>
                <span>{breakdown.percentageComplete.toFixed(1)}%</span>
              </div>
              <Progress value={breakdown.percentageComplete} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cycles Remaining */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <span>Cycle Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Cycles</div>
              <div className="font-semibold">{limits.totalCycles} months</div>
            </div>
            <div>
              <div className="text-muted-foreground">Remaining Cycles</div>
              <div className="font-semibold text-orange-600">{limits.cyclesRemaining} months</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Installment: {formatCurrency(limits.installmentAmount)} per month
          </div>
        </CardContent>
      </Card>
    </div>
  )
}