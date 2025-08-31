import { createClient } from '@/lib/supabase/client'

export interface PaymentLimits {
  minimum: number
  maximum: number
  recommended: number
  totalObligation: number
  totalPaid: number
  remainingObligation: number
  installmentAmount: number
  cyclesRemaining: number
  totalCycles: number
}

export interface PaymentBreakdown {
  currentCycle: number
  advanceAmount: number
  cyclesCovered: number
  remainingAfterPayment: number
  percentageComplete: number
}

/**
 * Calculate payment limits for a member in a specific chit fund
 */
export async function calculatePaymentLimits(
  memberId: string,
  chitFundId: string
): Promise<PaymentLimits | null> {
  const supabase = createClient()

  try {
    // Get chit fund details
    const { data: chitFund, error: chitFundError } = await supabase
      .from('chit_funds')
      .select('installment_amount, duration_months, total_amount')
      .eq('id', chitFundId)
      .single()

    if (chitFundError || !chitFund) {
      console.error('Error fetching chit fund:', chitFundError)
      return null
    }

    // Get total amount already paid by this member
    const { data: payments, error: paymentsError } = await supabase
      .from('collection_entries')
      .select('amount_collected')
      .eq('chit_fund_id', chitFundId)
      .eq('member_id', memberId)
      .eq('status', 'closed')

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return null
    }

    const totalPaid = payments?.reduce((sum, payment) => 
      sum + parseFloat(payment.amount_collected.toString()), 0) || 0

    const installmentAmount = parseFloat(chitFund.installment_amount.toString())
    const totalCycles = chitFund.duration_months
    const totalObligation = installmentAmount * totalCycles
    const remainingObligation = Math.max(0, totalObligation - totalPaid)
    const cyclesRemaining = Math.ceil(remainingObligation / installmentAmount)

    return {
      minimum: Math.min(installmentAmount, remainingObligation),
      maximum: Math.min(installmentAmount, remainingObligation), // Restrict to installment amount only
      recommended: Math.min(installmentAmount, remainingObligation), // No advance recommendations
      totalObligation,
      totalPaid,
      remainingObligation,
      installmentAmount,
      cyclesRemaining,
      totalCycles
    }
  } catch (error) {
    console.error('Error calculating payment limits:', error)
    return null
  }
}

/**
 * Calculate payment breakdown showing what the payment covers
 */
export function calculatePaymentBreakdown(
  paymentAmount: number,
  limits: PaymentLimits
): PaymentBreakdown {
  const currentCycle = Math.min(paymentAmount, limits.installmentAmount)
  const advanceAmount = Math.max(0, paymentAmount - limits.installmentAmount)
  const cyclesCovered = Math.floor(advanceAmount / limits.installmentAmount)
  const remainingAfterPayment = Math.max(0, limits.remainingObligation - paymentAmount)
  const percentageComplete = ((limits.totalPaid + paymentAmount) / limits.totalObligation) * 100

  return {
    currentCycle,
    advanceAmount,
    cyclesCovered,
    remainingAfterPayment,
    percentageComplete: Math.min(100, percentageComplete)
  }
}

/**
 * Get payment recommendation message
 */
export function getPaymentMessage(
  paymentAmount: number,
  limits: PaymentLimits
): { type: 'success' | 'info' | 'warning' | 'error'; message: string } {
  if (paymentAmount > limits.maximum) {
    return {
      type: 'error',
      message: `Payment cannot exceed installment amount of ₹${limits.installmentAmount.toFixed(2)}`
    }
  }

  if (paymentAmount < limits.minimum) {
    return {
      type: 'error',
      message: `Minimum payment is ₹${limits.minimum.toFixed(2)}`
    }
  }

  if (paymentAmount === limits.installmentAmount) {
    return {
      type: 'success',
      message: 'Normal installment payment'
    }
  }

  return {
    type: 'warning',
    message: 'Partial payment - remaining balance will be due next cycle'
  }
}

/**
 * Validate payment amount against limits
 */
export function validatePaymentAmount(
  paymentAmount: number,
  limits: PaymentLimits
): { isValid: boolean; error?: string } {
  if (paymentAmount <= 0) {
    return { isValid: false, error: 'Payment amount must be greater than 0' }
  }

  if (paymentAmount < limits.minimum) {
    return { 
      isValid: false, 
      error: `Minimum payment is ₹${limits.minimum.toFixed(2)}` 
    }
  }

  if (paymentAmount > limits.maximum) {
    return { 
      isValid: false, 
      error: `Payment cannot exceed installment amount of ₹${limits.installmentAmount.toFixed(2)}` 
    }
  }

  return { isValid: true }
}