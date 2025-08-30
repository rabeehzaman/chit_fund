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
}

export function ChitFundSelector({
  value,
  onValueChange,
  placeholder = "Select a chit fund",
  disabled = false,
  className = ""
}: ChitFundSelectorProps) {
  const [chitFunds, setChitFunds] = useState<ChitFund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChitFunds = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chit_funds')
        .select('*')
        .in('status', ['active', 'planning'])
        .order('name')

      if (error) {
        console.error('Error fetching chit funds:', error)
        return
      }

      setChitFunds(data || [])
      setLoading(false)
    }

    fetchChitFunds()
  }, [])

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
          <SelectItem key={fund.id} value={fund.id}>
            <div className="flex flex-col">
              <span className="font-medium">{fund.name}</span>
              <span className="text-sm text-muted-foreground">
                ₹{fund.installment_amount} × {fund.duration_months} months
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}