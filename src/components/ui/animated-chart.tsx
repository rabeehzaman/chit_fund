'use client'

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { springs, conditionalAnimation } from "@/lib/animations"

interface AnimatedChartWrapperProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  loading?: boolean
  error?: string | null
  height?: number
  interactive?: boolean
  onRetry?: () => void
}

export function AnimatedChartWrapper({
  title,
  description,
  children,
  className,
  loading = false,
  error = null,
  height = 300,
  interactive = true,
  onRetry
}: AnimatedChartWrapperProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 200)
    
    return () => clearTimeout(timer)
  }, [])

  const containerStyle = {
    transform: conditionalAnimation(
      isVisible 
        ? (isHovered && interactive ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)')
        : 'translateY(20px) scale(0.95)',
      isVisible 
        ? (isHovered && interactive ? 'translateY(-1px) scale(1.005)' : 'translateY(0) scale(1)')
        : 'translateY(10px) scale(0.98)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 300ms ease-out'
    )
  }

  const contentStyle = {
    transition: conditionalAnimation(
      `all ${springs.quick}`,
      'all 200ms ease-out'
    ),
    transform: loading ? 'scale(0.98)' : 'scale(1)',
    opacity: loading ? 0.7 : 1
  }

  return (
    <Card 
      className={cn(
        "transform-gpu transition-all duration-200 ease-out",
        interactive && "hover:shadow-lg cursor-default",
        className
      )}
      style={containerStyle}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          )}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div 
          className="relative"
          style={{ height: `${height}px`, ...contentStyle }}
        >
          {error ? (
            <ErrorState error={error} onRetry={onRetry} />
          ) : loading ? (
            <ChartSkeleton height={height} />
          ) : (
            <div className="w-full h-full">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Chart skeleton for loading states
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="w-full h-full flex items-end justify-between space-x-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-muted rounded-t animate-pulse"
          style={{
            height: `${Math.random() * (height * 0.7) + (height * 0.1)}px`,
            width: '100%',
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  )
}

// Error state component
function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
      <div className="text-red-500 text-4xl">⚠️</div>
      <div>
        <p className="text-sm font-medium text-red-600 mb-1">
          Failed to load chart data
        </p>
        <p className="text-xs text-muted-foreground">
          {error}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:text-blue-700 underline transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

// Enhanced chart container with data transition animations
interface AnimatedChartDataProps {
  children: React.ReactNode
  data: any[]
  animate?: boolean
  className?: string
}

export function AnimatedChartData({ 
  children, 
  data, 
  animate = true,
  className 
}: AnimatedChartDataProps) {
  const [displayData, setDisplayData] = React.useState(animate ? [] : data)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    if (!animate) {
      setDisplayData(data)
      return
    }

    setIsAnimating(true)
    
    // Animate data points in sequentially
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < data.length) {
        setDisplayData(prev => [...prev, data[currentIndex]])
        currentIndex++
      } else {
        clearInterval(interval)
        setIsAnimating(false)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [data, animate])

  return (
    <div className={cn("relative", className)}>
      {React.cloneElement(children as React.ReactElement, {
        data: displayData,
        className: cn(
          "transition-opacity duration-300",
          isAnimating ? "opacity-90" : "opacity-100"
        )
      } as any)}
      
      {isAnimating && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// Chart legend with hover animations
interface AnimatedChartLegendProps {
  items: {
    color: string
    label: string
    value?: string | number
  }[]
  className?: string
  onItemHover?: (index: number | null) => void
}

export function AnimatedChartLegend({ 
  items, 
  className,
  onItemHover 
}: AnimatedChartLegendProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const handleItemHover = (index: number | null) => {
    setHoveredIndex(index)
    onItemHover?.(index)
  }

  return (
    <div className={cn("flex flex-wrap gap-4 mt-4", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center space-x-2 cursor-pointer transform-gpu transition-all duration-200 ease-out"
          style={{
            transform: hoveredIndex === index 
              ? conditionalAnimation('scale(1.05)', 'scale(1.02)')
              : 'scale(1)',
            opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.6 : 1,
            transition: conditionalAnimation(
              `all ${springs.quick}`,
              'all 150ms ease-out'
            )
          }}
          onMouseEnter={() => handleItemHover(index)}
          onMouseLeave={() => handleItemHover(null)}
        >
          <div
            className="w-3 h-3 rounded-full transition-transform duration-200"
            style={{
              backgroundColor: item.color,
              transform: hoveredIndex === index ? 'scale(1.2)' : 'scale(1)'
            }}
          />
          <span className="text-sm font-medium">{item.label}</span>
          {item.value && (
            <span className="text-sm text-muted-foreground">
              ({item.value})
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// Chart tooltip with spring animations
interface AnimatedChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
}

export function AnimatedChartTooltip({
  active,
  payload,
  label,
  className
}: AnimatedChartTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [active])

  if (!active || !payload?.length) return null

  const tooltipStyle = {
    transform: conditionalAnimation(
      isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(10px)',
      isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(5px)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.quick}`,
      'all 150ms ease-out'
    )
  }

  return (
    <div
      className={cn(
        "bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs",
        className
      )}
      style={tooltipStyle}
    >
      {label && (
        <p className="font-medium text-sm mb-2 border-b border-border pb-1">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-medium">
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export all components
export {
  AnimatedChartWrapper as default,
  ChartSkeleton,
  ErrorState
}