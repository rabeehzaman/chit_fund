"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { springs, conditionalAnimation } from "@/lib/animations"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-primary/20",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
        xl: "h-4"
      },
      variant: {
        default: "bg-primary/20",
        secondary: "bg-secondary/20",
        success: "bg-green-500/20",
        warning: "bg-yellow-500/20",
        error: "bg-red-500/20"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        error: "bg-red-500"
      },
      animated: {
        true: "transition-transform",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      animated: true
    }
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof indicatorVariants>['variant']
  animated?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, variant, indicatorVariant, animated = true, ...props }, ref) => {
  const indicatorStyle = {
    transform: `translateX(-${100 - (value || 0)}%)`,
    transition: conditionalAnimation(
      animated ? `transform ${springs.slow}` : 'none',
      animated ? 'transform 400ms ease-out' : 'none'
    )
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ size, variant, className }))}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ variant: indicatorVariant || variant, animated }))}
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants, indicatorVariants }
