'use client'

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardProps } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { springs, staggerDelay, conditionalAnimation } from "@/lib/animations"

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
  const [isVisible, setIsVisible] = React.useState(false)
  
  // Trigger entrance animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay + (index * 100)) // Stagger by index
    
    return () => clearTimeout(timer)
  }, [index, delay])
  
  const animationStyle = {
    transform: conditionalAnimation(
      isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 300ms ease-out'
    )
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
  const [animateValue, setAnimateValue] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setAnimateValue(true), 200)
    return () => clearTimeout(timer)
  }, [])
  
  // Icon mapping - import icons dynamically
  const getIcon = (name?: string) => {
    if (!name) return null
    
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'DollarSign': require('lucide-react').DollarSign,
      'Target': require('lucide-react').Target,
      'Activity': require('lucide-react').Activity,
      'BarChart3': require('lucide-react').BarChart3,
      'AlertTriangle': require('lucide-react').AlertTriangle,
      'TrendingUp': require('lucide-react').TrendingUp,
      'TrendingDown': require('lucide-react').TrendingDown,
      'Clock': require('lucide-react').Clock,
      'Users': require('lucide-react').Users,
      'Wallet': require('lucide-react').Wallet
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
            animateValue ? "scale-100 opacity-100" : "scale-95 opacity-70"
          )}
          style={{
            transition: conditionalAnimation(
              `all ${springs.bounce}`,
              'all 500ms ease-out'
            )
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