import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { springs, conditionalAnimation } from "@/lib/animations"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow transform-gpu transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "shadow hover:shadow-lg",
        interactive: "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        flat: "shadow-none border-0 bg-transparent",
        elevated: "shadow-lg hover:shadow-xl"
      },
      animation: {
        none: "",
        subtle: "hover:shadow-md hover:-translate-y-0.5",
        lift: "hover:-translate-y-1 hover:shadow-lg",
        scale: "hover:scale-[1.02] hover:shadow-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      animation: "none"
    }
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, animation, interactive, style, ...props }, ref) => {
    // Apply spring animation with reduced motion support
    const combinedStyle = {
      ...style,
      transition: conditionalAnimation(
        `all ${springs.medium}`,
        'all 200ms ease-out'
      )
    }
    
    // Auto-detect interactive variant based on props
    const effectiveVariant = interactive 
      ? "interactive" 
      : variant || "default"
    
    const effectiveAnimation = interactive && !animation 
      ? "lift" 
      : animation || "none"

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant: effectiveVariant, animation: effectiveAnimation, className }))}
        style={combinedStyle}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
