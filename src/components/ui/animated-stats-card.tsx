'use client'

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardProps } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { springs, staggerDelay, conditionalAnimation, prefersReducedMotion } from "@/lib/animations"
import {
  DollarSign,
  Target,
  Activity,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Wallet
} from "lucide-react"

interface AnimatedStatsCardProps extends CardProps {
  index?: number
  delay?: number
  children: React.ReactNode
}

export function AnimatedStatsCard({ 
  className, 
  children, 
  index = 0, 
  delay = 0,
  ...props 
}: AnimatedStatsCardProps) {
  // Start with true for SSR to match initial client render
  const [isVisible, setIsVisible] = React.useState(true)
  const [isClient, setIsClient] = React.useState(false)
  
  // Detect client-side rendering
  React.useEffect(() => {
    setIsClient(true)
    // Only animate if we're on the client and the user doesn't prefer reduced motion
    if (!prefersReducedMotion()) {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay + (index * 100))
      
      return () => clearTimeout(timer)
    }
  }, [index, delay])
  
  // Use consistent initial styles for SSR/hydration
  const animationStyle = isClient ? {
    transform: conditionalAnimation(
      isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 300ms ease-out'
    )
  } : {
    // Default state for SSR - visible and ready
    transform: 'translateY(0) scale(1)',
    opacity: 1,
    transition: 'none'
  }
  
  return (
    <Card 
      className={cn(
        "transform-gpu hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out active:scale-[0.98]",
        className
      )}
      style={animationStyle}
      {...props}
    >
      {children}
    </Card>
  )
}

interface StatsCardContentProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  icon?: string // Change to icon name string
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export function StatsCardContent({
  title,
  value,
  subtitle,
  trend,
  icon: iconName,
  variant = 'default'
}: StatsCardContentProps) {
  // Start with true for SSR to prevent hydration mismatch
  const [animateValue, setAnimateValue] = React.useState(true)
  const [isClient, setIsClient] = React.useState(false)
  
  React.useEffect(() => {
    setIsClient(true)
    // Only animate if we're on the client and the user doesn't prefer reduced motion
    if (!prefersReducedMotion()) {
      setAnimateValue(false)
      const timer = setTimeout(() => setAnimateValue(true), 200)
      return () => clearTimeout(timer)
    }
  }, [])
  
  // Icon mapping - use static imports to avoid hydration mismatch
  const getIcon = (name?: string) => {
    if (!name) return null
    
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'DollarSign': DollarSign,
      'Target': Target,
      'Activity': Activity,
      'BarChart3': BarChart3,
      'AlertTriangle': AlertTriangle,
      'TrendingUp': TrendingUp,
      'TrendingDown': TrendingDown,
      'Clock': Clock,
      'Users': Users,
      'Wallet': Wallet
    }
    
    return iconMap[name] || null
  }
  
  const Icon = getIcon(iconName)
  
  const iconColorMap = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500"
  }
  
  const trendColorMap = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-muted-foreground"
  }
  
  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4 transition-colors duration-200", iconColorMap[variant])} />
        )}
      </CardHeader>
      <CardContent>
        <div 
          className={cn(
            "text-2xl font-bold transition-all duration-500 transform-gpu",
            // For SSR/initial render, always show as fully visible
            isClient 
              ? (animateValue ? "scale-100 opacity-100" : "scale-95 opacity-70")
              : "scale-100 opacity-100"
          )}
          style={isClient ? {
            transition: conditionalAnimation(
              `all ${springs.bounce}`,
              'all 500ms ease-out'
            )
          } : {
            transition: 'none'
          }}
        >
          {value}
        </div>
        
        {subtitle && (
          <div className="text-xs text-muted-foreground mb-1">
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div 
            className={cn(
              "flex items-center text-xs transition-all duration-300",
              trendColorMap[trend.positive === undefined ? 'neutral' : trend.positive ? 'positive' : 'negative']
            )}
          >
            {trend.positive !== undefined && (
              <div className={cn(
                "mr-1 h-3 w-3 transition-transform duration-300",
                trend.positive ? "rotate-0" : "rotate-180"
              )}>
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            )}
            <span>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </>
  )
}

// Wrapper component for grid of animated stats cards
interface AnimatedStatsGridProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedStatsGrid({ children, className }: AnimatedStatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
      className
    )}>
      {React.Children.map(children, (child, index) => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { index } as any)
          : child
      )}
    </div>
  )
}