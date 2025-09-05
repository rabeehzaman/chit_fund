"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ToggleUserStatusButtonProps {
  user: {
    id: string
    full_name: string
    is_active: boolean
  }
  onSuccess?: () => void
}

export function ToggleUserStatusButton({ user, onSuccess }: ToggleUserStatusButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      const newStatus = !user.is_active
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating user status:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to update user status. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: `User ${newStatus ? 'activated' : 'deactivated'} successfully!`,
        description: `${user.full_name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
      })

      // Call the success callback if provided, otherwise fallback to router.refresh()
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? 'Updating...' : (user.is_active ? 'Deactivate' : 'Activate')}
    </Button>
  )
}