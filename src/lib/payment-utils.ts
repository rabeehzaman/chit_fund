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

export interface CyclePaymentStatus {
  cycleId: string
  installmentAmount: number
  amountPaid: number
  remainingAmount: number
  isFullyPaid: boolean
  paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid'
}

export interface PaymentValidation {
  isValid: boolean
  errorMessage?: string
  maxPayable: number
  currentPaid: number
  installmentAmount: number
}

export interface NextPayableCycle {
  cycleId: string
  cycleNumber: number
  cycleDate: string
  paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid'
  remainingAmount: number
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
      .select('installment_per_member, duration_months, total_amount')
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

    const installmentAmount = parseFloat(chitFund.installment_per_member.toString())
    const totalCycles = chitFund.duration_months
    const totalObligation = installmentAmount * totalCycles
    const remainingObligation = Math.max(0, totalObligation - totalPaid)
    const cyclesRemaining = Math.ceil(remainingObligation / installmentAmount)

    return {
      minimum: 1,
      maximum: remainingObligation, // Allow advances up to remaining obligation
      recommended: Math.min(installmentAmount, remainingObligation),
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
      message: `Payment cannot exceed remaining obligation of ₹${limits.maximum.toFixed(2)}`
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

  if (paymentAmount > limits.installmentAmount) {
    return {
      type: 'info',
      message: 'Advance payment - extra will be applied to future cycles'
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

  if (paymentAmount > limits.maximum) {
    return { 
      isValid: false, 
      error: `Payment cannot exceed remaining obligation of ₹${limits.maximum.toFixed(2)}` 
    }
  }

  return { isValid: true }
}

/**
 * Get cycle payment status for a specific member-cycle combination
 */
export async function getCyclePaymentStatus(
  memberId: string,
  cycleId: string
): Promise<CyclePaymentStatus | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_cycle_payment_status', {
      p_member_id: memberId,
      p_cycle_id: cycleId
    })

    if (error) {
      console.error('Error getting cycle payment status:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const row = data[0]
    return {
      cycleId: row.cycle_id,
      installmentAmount: parseFloat(row.installment_amount),
      amountPaid: parseFloat(row.amount_paid),
      remainingAmount: parseFloat(row.remaining_amount),
      isFullyPaid: row.is_fully_paid,
      paymentStatus: row.payment_status
    }
  } catch (error) {
    console.error('Error getting cycle payment status:', error)
    return null
  }
}

/**
 * Get maximum payable amount for a member-cycle combination
 */
export async function getMaxPayableAmount(
  memberId: string,
  cycleId: string
): Promise<number> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_max_payable_amount', {
      p_member_id: memberId,
      p_cycle_id: cycleId
    })

    if (error) {
      console.error('Error getting max payable amount:', error)
      return 0
    }

    return parseFloat(data) || 0
  } catch (error) {
    console.error('Error getting max payable amount:', error)
    return 0
  }
}

/**
 * Validate if a payment can be made
 */
export async function validatePaymentAttempt(
  memberId: string,
  cycleId: string,
  paymentAmount: number
): Promise<PaymentValidation> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('validate_payment_attempt', {
      p_member_id: memberId,
      p_cycle_id: cycleId,
      p_payment_amount: paymentAmount
    })

    if (error) {
      console.error('Error validating payment attempt:', error)
      return {
        isValid: false,
        errorMessage: 'Error validating payment',
        maxPayable: 0,
        currentPaid: 0,
        installmentAmount: 0
      }
    }

    if (!data || data.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Unable to validate payment',
        maxPayable: 0,
        currentPaid: 0,
        installmentAmount: 0
      }
    }

    const row = data[0]
    return {
      isValid: row.is_valid,
      errorMessage: row.error_message || undefined,
      maxPayable: parseFloat(row.max_payable),
      currentPaid: parseFloat(row.current_paid),
      installmentAmount: parseFloat(row.installment_amount)
    }
  } catch (error) {
    console.error('Error validating payment attempt:', error)
    return {
      isValid: false,
      errorMessage: 'Error validating payment',
      maxPayable: 0,
      currentPaid: 0,
      installmentAmount: 0
    }
  }
}

/**
 * Get the next payable cycle for a member
 */
export async function getNextPayableCycle(
  memberId: string,
  chitFundId: string,
  currentCycleId?: string
): Promise<NextPayableCycle | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_next_payable_cycle', {
      p_member_id: memberId,
      p_chit_fund_id: chitFundId,
      p_current_cycle_id: currentCycleId || null
    })

    if (error) {
      console.error('Error getting next payable cycle:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const row = data[0]
    return {
      cycleId: row.cycle_id,
      cycleNumber: row.cycle_number,
      cycleDate: row.cycle_date,
      paymentStatus: row.payment_status,
      remainingAmount: parseFloat(row.remaining_amount)
    }
  } catch (error) {
    console.error('Error getting next payable cycle:', error)
    return null
  }
}