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

type Member = Tables<'members'>

interface MemberWithChitFund extends Member {
  chit_fund_members?: {
    status: string | null
    assigned_collector_id: string | null
  }[]
}

interface MemberSelectorProps {
  chitFundId: string | null
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showOnlyAssigned?: boolean
  collectorId?: string
  refreshKey?: number | string // Add refresh trigger
}

export function MemberSelector({
  chitFundId,
  value,
  onValueChange,
  placeholder = "Select a member",
  disabled = false,
  className = "",
  showOnlyAssigned = false,
  collectorId,
  refreshKey
}: MemberSelectorProps) {
  const [members, setMembers] = useState<MemberWithChitFund[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!chitFundId) {
      setMembers([])
      return
    }

    const fetchMembers = async () => {
      setLoading(true)
      const supabase = createClient()
      
      // Add cache-busting query parameter to force fresh data
      const timestamp = Date.now()
      
      let query = supabase
        .from('members')
        .select(`
          *,
          chit_fund_members!inner (
            status,
            assigned_collector_id
          )
        `)
        .eq('chit_fund_members.chit_fund_id', chitFundId)
        .eq('chit_fund_members.status', 'active')
        .order('full_name')

      // If showOnlyAssigned is true and collectorId is provided, filter by collector
      if (showOnlyAssigned && collectorId) {
        query = query.eq('chit_fund_members.assigned_collector_id', collectorId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching members:', error)
        setLoading(false)
        return
      }

      setMembers(data || [])
      setLoading(false)
    }

    fetchMembers()
  }, [chitFundId, showOnlyAssigned, collectorId, refreshKey])

  const isDisabled = disabled || loading || !chitFundId || members.length === 0

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger className={className}>
        <SelectValue 
          placeholder={
            loading ? "Loading members..." : 
            !chitFundId ? "Select chit fund first" :
            members.length === 0 ? "No members available" :
            placeholder
          } 
        />
      </SelectTrigger>
      <SelectContent>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <div className="flex flex-col">
              <span className="font-medium">{member.full_name}</span>
              {member.phone && (
                <span className="text-sm text-muted-foreground">
                  {member.phone}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}