'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!chitFundId) {
      setMembers([])
      return
    }

    const fetchMembers = async () => {
      setLoading(true)
      const supabase = createClient()

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

  // Find selected member
  const selectedMember = members.find((member) => member.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isDisabled}
        >
          <div className="flex flex-col items-start text-left overflow-hidden">
            {selectedMember ? (
              <>
                <span className="font-medium truncate">{selectedMember.full_name}</span>
                {selectedMember.phone && (
                  <span className="text-xs text-muted-foreground truncate">
                    {selectedMember.phone}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                {loading ? "Loading members..." :
                 !chitFundId ? "Select chit fund first" :
                 members.length === 0 ? "No members available" :
                 placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members by name or phone..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.full_name} ${member.phone || ''}`}
                  onSelect={() => {
                    onValueChange(member.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === member.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{member.full_name}</span>
                    {member.phone && (
                      <span className="text-sm text-muted-foreground">
                        {member.phone}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}