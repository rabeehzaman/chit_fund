'use client'

import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { useState, useEffect } from "react"

export function ClientTimeBadge() {
  const [time, setTime] = useState<string>("")
  
  useEffect(() => {
    // Set the time on the client side to avoid hydration mismatch
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString())
    }
    
    updateTime()
    
    // Optional: Update time every minute
    const interval = setInterval(updateTime, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Don't render anything during SSR
  if (!time) {
    return (
      <Badge variant="outline">
        <Clock className="mr-1 h-3 w-3" />
        Loading...
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline">
      <Clock className="mr-1 h-3 w-3" />
      Updated: {time}
    </Badge>
  )
}