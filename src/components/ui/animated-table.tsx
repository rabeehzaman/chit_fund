'use client'

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { springs, staggerDelay, conditionalAnimation } from "@/lib/animations"

interface AnimatedTableProps extends React.ComponentProps<typeof Table> {
  children: React.ReactNode
  staggerDelay?: number
}

export function AnimatedTable({ 
  children, 
  className, 
  staggerDelay: baseDelay = 50,
  ...props 
}: AnimatedTableProps) {
  return (
    <Table className={cn("relative", className)} {...props}>
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child) && child.type === AnimatedTableBody
          ? React.cloneElement(child, { staggerDelay: baseDelay } as any)
          : child
      )}
    </Table>
  )
}

interface AnimatedTableBodyProps extends React.ComponentProps<typeof TableBody> {
  children: React.ReactNode
  staggerDelay?: number
}

export function AnimatedTableBody({ 
  children, 
  className, 
  staggerDelay = 50,
  ...props 
}: AnimatedTableBodyProps) {
  return (
    <TableBody className={className} {...props}>
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child) && child.type !== React.Fragment
          ? React.cloneElement(child as any, { 
              animationIndex: index, 
              staggerDelay 
            } as any)
          : child
      )}
    </TableBody>
  )
}

interface AnimatedTableRowProps extends React.ComponentProps<typeof TableRow> {
  children: React.ReactNode
  animationIndex?: number
  staggerDelay?: number
  interactive?: boolean
  onClick?: () => void
}

export function AnimatedTableRow({ 
  children, 
  className, 
  animationIndex = 0,
  staggerDelay = 50,
  interactive = false,
  onClick,
  ...props 
}: AnimatedTableRowProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, animationIndex * staggerDelay)
    
    return () => clearTimeout(timer)
  }, [animationIndex, staggerDelay])
  
  const animationStyle = {
    transform: conditionalAnimation(
      isVisible 
        ? (isHovered && interactive ? 'translateY(0) scale(1.01)' : 'translateY(0) scale(1)') 
        : 'translateY(20px) scale(0.98)',
      isVisible 
        ? (isHovered && interactive ? 'translateY(0) scale(1.005)' : 'translateY(0) scale(1)') 
        : 'translateY(10px) scale(0.99)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 250ms ease-out'
    ),
    backgroundColor: isHovered && interactive 
      ? 'var(--muted)' 
      : 'transparent'
  }
  
  return (
    <TableRow 
      className={cn(
        "transform-gpu transition-all duration-200 ease-out",
        interactive && "cursor-pointer hover:shadow-sm",
        className
      )}
      style={animationStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
    </TableRow>
  )
}

// Enhanced table header with subtle animations
export function AnimatedTableHeader({ 
  children, 
  className,
  ...props 
}: React.ComponentProps<typeof TableHeader>) {
  const [isVisible, setIsVisible] = React.useState(false)
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])
  
  const animationStyle = {
    transform: conditionalAnimation(
      isVisible ? 'translateY(0)' : 'translateY(-10px)',
      isVisible ? 'translateY(0)' : 'translateY(-5px)'
    ),
    opacity: isVisible ? 1 : 0,
    transition: conditionalAnimation(
      `all ${springs.medium}`,
      'all 200ms ease-out'
    )
  }
  
  return (
    <TableHeader 
      className={cn("transform-gpu", className)} 
      style={animationStyle}
      {...props}
    >
      {children}
    </TableHeader>
  )
}

// Cell with subtle hover animations
interface AnimatedTableCellProps extends React.ComponentProps<typeof TableCell> {
  interactive?: boolean
}

export function AnimatedTableCell({ 
  children, 
  className, 
  interactive = false,
  ...props 
}: AnimatedTableCellProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  
  const cellStyle = {
    transition: conditionalAnimation(
      `all ${springs.quick}`,
      'all 150ms ease-out'
    ),
    transform: isHovered && interactive ? 'scale(1.02)' : 'scale(1)'
  }
  
  return (
    <TableCell 
      className={cn(
        "transform-gpu transition-all duration-150 ease-out",
        interactive && "hover:bg-muted/50",
        className
      )}
      style={cellStyle}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      {...props}
    >
      {children}
    </TableCell>
  )
}

// Loading skeleton for tables
interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: TableSkeletonProps) {
  return (
    <Table className={className}>
      <AnimatedTableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </TableHead>
          ))}
        </TableRow>
      </AnimatedTableHeader>
      <AnimatedTableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <AnimatedTableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <AnimatedTableCell key={colIndex}>
                <div 
                  className="h-4 bg-muted rounded animate-pulse"
                  style={{
                    animationDelay: `${(rowIndex * columns + colIndex) * 100}ms`
                  }}
                />
              </AnimatedTableCell>
            ))}
          </AnimatedTableRow>
        ))}
      </AnimatedTableBody>
    </Table>
  )
}

// Export all table components for convenience
export {
  Table,
  TableHead,
  TableBody as StaticTableBody,
  TableCell as StaticTableCell,
  TableHeader as StaticTableHeader,
  TableRow as StaticTableRow
}

// Wrapper component for enhanced table experience
interface EnhancedTableProps {
  children: React.ReactNode
  className?: string
  loading?: boolean
  loadingRows?: number
  loadingColumns?: number
  interactive?: boolean
  onRowClick?: (index: number) => void
}

export function EnhancedTable({
  children,
  className,
  loading = false,
  loadingRows = 5,
  loadingColumns = 4,
  interactive = false,
  onRowClick
}: EnhancedTableProps) {
  if (loading) {
    return <TableSkeleton rows={loadingRows} columns={loadingColumns} className={className} />
  }
  
  return (
    <AnimatedTable className={className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && child.type === AnimatedTableBody
          ? React.cloneElement(child, { 
              children: React.Children.map((child as any).props.children, (row, index) =>
                React.isValidElement(row) && row.type === AnimatedTableRow
                  ? React.cloneElement(row, { 
                      interactive,
                      onClick: onRowClick ? () => onRowClick(index) : (row as any).props.onClick
                    } as any)
                  : row
              )
            } as any)
          : child
      )}
    </AnimatedTable>
  )
}