'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ChitFund = Tables<'chit_funds'>

interface ChitFundSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  refreshKey?: number // Add this to force refresh when needed
}

export function ChitFundSelector({
  value,
  onValueChange,
  placeholder = "Select a chit fund",
  disabled = false,
  className = "",
  refreshKey = 0
}: ChitFundSelectorProps) {
  const [chitFunds, setChitFunds] = useState<ChitFund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChitFunds = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chit_funds')
        .select('*')
        .in('status', ['active', 'planning'])
        .order('name')

      if (error) {
        console.error('Error fetching chit funds:', error)
        setLoading(false)
        return
      }

      setChitFunds(data || [])
      setLoading(false)
    }

    fetchChitFunds()
  }, [refreshKey])

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {chitFunds.map((fund) => (
          <SelectItem key={fund.id} value={fund.id} textValue={fund.name}>
            <div className="flex flex-col py-1">
              <span className="font-medium">{fund.name}</span>
              <span className="text-xs text-muted-foreground">
                ₹{fund.installment_per_member.toLocaleString()} × {fund.duration_months} months
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}