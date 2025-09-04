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
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

type Cycle = Tables<'cycles'> & {
  payment_status?: 'unpaid' | 'partially_paid' | 'fully_paid'
  amount_paid?: number
  installment_amount?: number
}

interface CycleSelectorProps {
  chitFundId: string | null
  memberId?: string | null
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CycleSelector({
  chitFundId,
  memberId = null,
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
      
      if (memberId) {
        // Fetch cycles with payment status for the specific member
        const { data, error } = await supabase
          .from('cycles')
          .select(`
            *,
            collection_entries!left (
              amount_collected,
              status
            ),
            chit_funds!inner (
              installment_per_member
            )
          `)
          .eq('chit_fund_id', chitFundId)
          .eq('collection_entries.member_id', memberId)
          .eq('collection_entries.status', 'closed')
          .order('cycle_number')

        if (error) {
          console.error('Error fetching cycles with payment status:', error)
          setLoading(false)
          return
        }

        // Process the data to include payment status
        const cyclesWithStatus = (data || []).map(cycle => {
          const totalPaid = cycle.collection_entries?.reduce((sum: number, entry: any) => 
            sum + parseFloat(entry.amount_collected), 0) || 0
          const installmentAmount = cycle.chit_funds?.installment_per_member || 0
          
          return {
            ...cycle,
            amount_paid: totalPaid,
            installment_amount: installmentAmount,
            payment_status: totalPaid === 0 ? 'unpaid' : 
                           totalPaid >= installmentAmount ? 'fully_paid' : 'partially_paid'
          }
        })
        
        setCycles(cyclesWithStatus)
      } else {
        // Fetch cycles without payment status
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
      }
      
      setLoading(false)
    }

    fetchCycles()
  }, [chitFundId, memberId])

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

  const getPaymentStatusColor = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'fully_paid':
        return 'text-green-600'
      case 'partially_paid':
        return 'text-yellow-600'
      case 'unpaid':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  const getPaymentStatusIcon = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'fully_paid':
        return <CheckCircle className="h-4 w-4" />
      case 'partially_paid':
        return <Clock className="h-4 w-4" />
      case 'unpaid':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
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
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Cycle {cycle.cycle_number}</span>
                  {memberId && cycle.payment_status && (
                    <div className={`flex items-center gap-1 ${getPaymentStatusColor(cycle.payment_status)}`}>
                      {getPaymentStatusIcon(cycle.payment_status)}
                      <span className="text-xs">
                        {cycle.payment_status === 'fully_paid' && 'Paid'}
                        {cycle.payment_status === 'partially_paid' && 
                          `₹${cycle.amount_paid?.toFixed(0)}/₹${cycle.installment_amount?.toFixed(0)}`}
                        {cycle.payment_status === 'unpaid' && 'Unpaid'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(cycle.cycle_date)}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Badge className={getStatusColor(cycle.status)}>
                  {cycle.status || 'upcoming'}
                </Badge>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}