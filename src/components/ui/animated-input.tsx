'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { springs, conditionalAnimation } from "@/lib/animations"

const inputVariants = cva(
  "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transform-gpu",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring",
        success: "border-green-500 focus-visible:ring-green-500/20 text-green-900 bg-green-50/50",
        error: "border-red-500 focus-visible:ring-red-500/20 text-red-900 bg-red-50/50 animate-shake",
        warning: "border-yellow-500 focus-visible:ring-yellow-500/20 text-yellow-900 bg-yellow-50/50",
      },
      size: {
        sm: "h-8 px-2 text-sm",
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface AnimatedInputProps
  extends Omit<React.ComponentProps<"input">, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  helperText?: string
  errorText?: string
  successText?: string
  showCounter?: boolean
  maxLength?: number
  icon?: React.ComponentType<{ className?: string }>
  onValidation?: (value: string) => 'success' | 'error' | 'warning' | null
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type, 
    label,
    helperText,
    errorText,
    successText,
    showCounter,
    maxLength,
    icon: Icon,
    onValidation,
    onFocus, 
    onBlur,
    onChange,
    value,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!value)
    const [currentVariant, setCurrentVariant] = React.useState(variant || 'default')
    const [validationMessage, setValidationMessage] = React.useState<string>('')

    // Handle input state changes
    React.useEffect(() => {
      setHasValue(!!value)
    }, [value])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      
      // Auto-select content for number inputs
      if (type === "number") {
        e.target.select()
      }
      
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setHasValue(!!newValue)
      
      // Run validation if provided
      if (onValidation) {
        const validationResult = onValidation(newValue)
        setCurrentVariant(validationResult || 'default')
        
        // Set validation message
        switch (validationResult) {
          case 'success':
            setValidationMessage(successText || '')
            break
          case 'error':
            setValidationMessage(errorText || '')
            break
          default:
            setValidationMessage('')
        }
      }
      
      onChange?.(e)
    }

    // Override variant based on validation
    const finalVariant = onValidation ? currentVariant : variant || 'default'

    // Animation styles
    const containerStyle = {
      transition: conditionalAnimation(
        `all ${springs.quick}`,
        'all 200ms ease-out'
      )
    }

    const inputStyle = {
      transition: conditionalAnimation(
        `all ${springs.quick}`,
        'all 200ms ease-out'
      ),
      transform: isFocused ? 'scale(1.01)' : 'scale(1)',
      boxShadow: isFocused 
        ? finalVariant === 'error' 
          ? '0 0 0 2px rgb(239 68 68 / 0.2)' 
          : finalVariant === 'success'
          ? '0 0 0 2px rgb(34 197 94 / 0.2)'
          : '0 0 0 2px rgb(59 130 246 / 0.2)'
        : 'none'
    }

    const labelStyle = {
      transform: conditionalAnimation(
        (isFocused || hasValue) ? 'translateY(-20px) scale(0.85)' : 'translateY(0) scale(1)',
        (isFocused || hasValue) ? 'translateY(-16px) scale(0.9)' : 'translateY(0) scale(1)'
      ),
      transformOrigin: 'left top',
      transition: conditionalAnimation(
        `all ${springs.medium}`,
        'all 250ms ease-out'
      ),
      color: isFocused 
        ? finalVariant === 'error' ? 'rgb(239 68 68)' : 'rgb(59 130 246)'
        : 'rgb(107 114 128)'
    }

    const messageStyle = {
      opacity: validationMessage || helperText ? 1 : 0,
      transform: conditionalAnimation(
        (validationMessage || helperText) ? 'translateY(0)' : 'translateY(-10px)',
        (validationMessage || helperText) ? 'translateY(0)' : 'translateY(-5px)'
      ),
      transition: conditionalAnimation(
        `all ${springs.medium}`,
        'all 200ms ease-out'
      )
    }

    const counterColor = maxLength && value && value.toString().length > maxLength * 0.9
      ? 'text-red-500'
      : 'text-muted-foreground'

    return (
      <div className="relative space-y-2" style={containerStyle}>
        {/* Input Container */}
        <div className="relative">
          {/* Floating Label */}
          {label && (
            <label
              className={cn(
                "absolute left-3 top-2 pointer-events-none text-sm font-medium z-10 bg-background px-1",
                isFocused || hasValue ? "text-xs" : "text-sm"
              )}
              style={labelStyle}
            >
              {label}
            </label>
          )}

          {/* Icon */}
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Input Field */}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, size }),
              Icon && "pl-10",
              showCounter && maxLength && "pr-16",
              "focus-visible:outline-none focus-visible:ring-1",
              className
            )}
            style={inputStyle}
            ref={ref}
            value={value}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Character Counter */}
          {showCounter && maxLength && (
            <div className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium",
              counterColor
            )}>
              {value ? value.toString().length : 0}/{maxLength}
            </div>
          )}
        </div>

        {/* Helper/Error Text */}
        <div 
          className="min-h-[1.25rem]"
          style={messageStyle}
        >
          {validationMessage && (
            <p className={cn(
              "text-xs font-medium",
              finalVariant === 'success' && "text-green-600",
              finalVariant === 'error' && "text-red-600",
              finalVariant === 'warning' && "text-yellow-600"
            )}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      </div>
    )
  }
)
AnimatedInput.displayName = "AnimatedInput"

// Enhanced form group component
interface AnimatedFormGroupProps {
  children: React.ReactNode
  className?: string
  stacked?: boolean
}

export function AnimatedFormGroup({ 
  children, 
  className, 
  stacked = true 
}: AnimatedFormGroupProps) {
  return (
    <div className={cn(
      stacked ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4",
      className
    )}>
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child) ? (
          <div
            key={index}
            style={{
              transform: conditionalAnimation(
                'translateY(0)',
                'translateY(0)'
              ),
              opacity: 1,
              transition: conditionalAnimation(
                `all ${springs.medium}`,
                'all 200ms ease-out'
              ),
              transitionDelay: `${index * 100}ms`
            }}
          >
            {child}
          </div>
        ) : child
      )}
    </div>
  )
}

export { inputVariants }