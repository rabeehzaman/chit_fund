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
import { Badge } from "@/components/ui/badge"

type Cycle = Tables<'cycles'>

interface CycleSelectorProps {
  chitFundId: string | null
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CycleSelector({
  chitFundId,
  value,
  onValueChange,
  placeholder = "Select a cycle",
  disabled = false,
  className = ""
}: CycleSelectorProps) {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!chitFundId) {
      setCycles([])
      return
    }

    const fetchCycles = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('chit_fund_id', chitFundId)
        .order('cycle_number')

      if (error) {
        console.error('Error fetching cycles:', error)
        setLoading(false)
        return
      }

      setCycles(data || [])
      setLoading(false)
    }

    fetchCycles()
  }, [chitFundId])

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    })
  }

  const isDisabled = disabled || loading || !chitFundId || cycles.length === 0

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger className={className}>
        <SelectValue 
          placeholder={
            loading ? "Loading cycles..." : 
            !chitFundId ? "Select chit fund first" :
            cycles.length === 0 ? "No cycles available" :
            placeholder
          } 
        />
      </SelectTrigger>
      <SelectContent>
        {cycles.map((cycle) => (
          <SelectItem key={cycle.id} value={cycle.id}>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium">Cycle {cycle.cycle_number}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(cycle.cycle_date)}
                </span>
              </div>
              <Badge className={`ml-2 ${getStatusColor(cycle.status)}`}>
                {cycle.status || 'upcoming'}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}