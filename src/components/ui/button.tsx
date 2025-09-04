import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { springs, conditionalAnimation } from "@/lib/animations"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transform-gpu transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 hover:border-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 hover:border-destructive/90",
        outline:
          "border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary hover:bg-secondary/80 hover:border-secondary/80",
        ghost: "text-foreground hover:bg-foreground/10 hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline shadow-none hover:shadow-none active:shadow-none hover:scale-100 active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Apply spring animation with reduced motion support
    const springStyle = conditionalAnimation(
      `transition: all ${springs.quick}`, 
      'transition: all 150ms ease-out'
    )
    
    const combinedStyle = {
      ...style,
      transition: conditionalAnimation(
        `all ${springs.quick}`,
        'all 150ms ease-out'
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={combinedStyle}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
