import { CycleIntervalType } from '@/lib/supabase/types'

export interface CycleGenerationOptions {
  startDate: string
  totalCycles: number
  intervalType: CycleIntervalType
  intervalValue: number
}

export interface CycleData {
  chit_fund_id: string
  cycle_number: number
  cycle_date: string
  total_amount: number
  status: string
}

/**
 * Calculate the next cycle date based on interval type and value
 */
export function calculateNextCycleDate(
  baseDate: Date,
  cycleIndex: number,
  intervalType: CycleIntervalType,
  intervalValue: number
): Date {
  const nextDate = new Date(baseDate)
  
  switch (intervalType) {
    case 'weekly':
      // Add weeks (intervalValue should be number of weeks)
      nextDate.setDate(nextDate.getDate() + (cycleIndex * intervalValue * 7))
      break
    
    case 'monthly':
      // Add months (intervalValue should be number of months)
      nextDate.setMonth(nextDate.getMonth() + (cycleIndex * intervalValue))
      break
    
    case 'custom_days':
      // Add custom number of days
      nextDate.setDate(nextDate.getDate() + (cycleIndex * intervalValue))
      break
    
    default:
      throw new Error(`Unsupported interval type: ${intervalType}`)
  }
  
  return nextDate
}

/**
 * Generate cycles for a chit fund based on flexible intervals
 */
export function generateCycles(
  chitFundId: string,
  options: CycleGenerationOptions
): CycleData[] {
  const { startDate, totalCycles, intervalType, intervalValue } = options
  const baseDate = new Date(startDate)
  const cycles: CycleData[] = []

  for (let i = 0; i < totalCycles; i++) {
    const cycleDate = calculateNextCycleDate(baseDate, i, intervalType, intervalValue)
    
    cycles.push({
      chit_fund_id: chitFundId,
      cycle_number: i + 1,
      cycle_date: cycleDate.toISOString().split('T')[0], // YYYY-MM-DD format
      total_amount: 0,
      status: i === 0 ? 'active' : 'upcoming'
    })
  }

  return cycles
}

/**
 * Get human-readable interval description
 */
export function getIntervalDescription(
  intervalType: CycleIntervalType,
  intervalValue: number,
  totalCycles: number
): string {
  let intervalText = ''
  
  switch (intervalType) {
    case 'weekly':
      intervalText = intervalValue === 1 ? 'week' : `${intervalValue} weeks`
      break
    case 'monthly':
      intervalText = intervalValue === 1 ? 'month' : `${intervalValue} months`
      break
    case 'custom_days':
      intervalText = intervalValue === 1 ? 'day' : `${intervalValue} days`
      break
  }
  
  return `${totalCycles} cycles, every ${intervalText}`
}

/**
 * Calculate total duration in days for the chit fund
 */
export function calculateTotalDuration(
  totalCycles: number,
  intervalType: CycleIntervalType,
  intervalValue: number
): number {
  switch (intervalType) {
    case 'weekly':
      return (totalCycles - 1) * intervalValue * 7
    case 'monthly':
      // Approximate: 30.44 days per month on average
      return Math.round((totalCycles - 1) * intervalValue * 30.44)
    case 'custom_days':
      return (totalCycles - 1) * intervalValue
    default:
      return 0
  }
}

/**
 * Calculate expected end date for the chit fund
 */
export function calculateEndDate(
  startDate: string,
  totalCycles: number,
  intervalType: CycleIntervalType,
  intervalValue: number
): string {
  const baseDate = new Date(startDate)
  const endDate = calculateNextCycleDate(baseDate, totalCycles - 1, intervalType, intervalValue)
  return endDate.toISOString().split('T')[0]
}

/**
 * Validate cycle configuration
 */
export function validateCycleConfiguration(
  intervalType: CycleIntervalType,
  intervalValue: number,
  totalCycles: number
): { isValid: boolean; error?: string } {
  if (intervalValue <= 0) {
    return { isValid: false, error: 'Interval value must be greater than 0' }
  }
  
  if (totalCycles <= 0) {
    return { isValid: false, error: 'Total cycles must be greater than 0' }
  }
  
  // No maximum limit - funds can have unlimited cycles
  
  // Validate specific interval types
  switch (intervalType) {
    case 'weekly':
      if (intervalValue > 4) {
        return { isValid: false, error: 'Weekly interval cannot exceed 4 weeks' }
      }
      break
    case 'monthly':
      if (intervalValue > 12) {
        return { isValid: false, error: 'Monthly interval cannot exceed 12 months' }
      }
      break
    case 'custom_days':
      if (intervalValue > 365) {
        return { isValid: false, error: 'Custom interval cannot exceed 365 days' }
      }
      break
  }
  
  return { isValid: true }
}

/**
 * Get interval type options for UI
 */
export const INTERVAL_TYPE_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Every week(s)' },
  { value: 'monthly', label: 'Monthly', description: 'Every month(s)' },
  { value: 'custom_days', label: 'Custom Days', description: 'Every X days' },
] as const

/**
 * Get common preset intervals
 */
export const COMMON_INTERVALS = {
  weekly: [
    { value: 1, label: 'Every week', description: '7 days' },
    { value: 2, label: 'Every 2 weeks', description: '14 days' },
  ],
  monthly: [
    { value: 1, label: 'Every month', description: '~30 days' },
    { value: 2, label: 'Every 2 months', description: '~60 days' },
    { value: 3, label: 'Every 3 months', description: '~90 days' },
  ],
  custom_days: [
    { value: 7, label: 'Every 7 days', description: 'Weekly equivalent' },
    { value: 10, label: 'Every 10 days', description: 'Popular option' },
    { value: 15, label: 'Every 15 days', description: 'Bi-monthly' },
    { value: 30, label: 'Every 30 days', description: 'Monthly equivalent' },
  ],
} as const