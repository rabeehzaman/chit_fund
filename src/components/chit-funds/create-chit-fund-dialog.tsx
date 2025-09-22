"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { ensureSystemProfile, getAnyProfileId, SYSTEM_PROFILE_ID } from "@/lib/system"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, DollarSign, Hash, Users, Clock } from "lucide-react"
import { CycleIntervalType } from "@/lib/supabase/types"
import { INTERVAL_TYPE_OPTIONS, COMMON_INTERVALS, validateCycleConfiguration, generateCycles, getIntervalDescription } from "@/lib/utils/cycle-utils"

const createChitFundSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  installment_per_member: z.union([z.coerce.number(), z.literal("")]).optional().refine((val) => {
    if (val === "" || val === undefined) return true
    return val >= 100 && val <= 1000000
  }, {
    message: "Installment per member must be between ₹100 and ₹10,00,000"
  }),
  duration_months: z.coerce.number().min(1, "Duration must be at least 1 month"),
  total_cycles: z.coerce.number().min(1, "At least 1 cycle required"),
  cycle_interval_type: z.enum(["weekly", "monthly", "custom_days"]),
  cycle_interval_value: z.coerce.number().min(1, "Interval value must be at least 1").max(365, "Interval value too large"),
  start_date: z.string().min(1, "Start date is required"),
  description: z.string().optional(),
}).refine(
  (data) => {
    // Validate cycle configuration
    const validation = validateCycleConfiguration(
      data.cycle_interval_type,
      data.cycle_interval_value,
      data.total_cycles
    )
    return validation.isValid
  },
  {
    message: "Invalid cycle configuration",
    path: ["cycle_interval_value"],
  }
)

type CreateChitFundForm = z.infer<typeof createChitFundSchema>

interface CreateChitFundDialogProps {
  children: React.ReactNode
}

export function CreateChitFundDialog({ children }: CreateChitFundDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<CreateChitFundForm>({
    resolver: zodResolver(createChitFundSchema),
    defaultValues: {
      name: "",
      installment_per_member: undefined as any,
      duration_months: 12, // Keep for backward compatibility
      total_cycles: 12,
      cycle_interval_type: "monthly",
      cycle_interval_value: 1,
      start_date: "",
      description: "",
    },
  })

  // Watch values to provide real-time calculations
  const watchedInstallment = form.watch("installment_per_member")
  const watchedTotalCycles = form.watch("total_cycles")
  const watchedIntervalType = form.watch("cycle_interval_type")
  const watchedIntervalValue = form.watch("cycle_interval_value")

  // Auto-update duration_months for backward compatibility
  React.useEffect(() => {
    if (watchedIntervalType === 'monthly' && watchedIntervalValue === 1) {
      form.setValue('duration_months', watchedTotalCycles)
    } else {
      // Calculate approximate months for non-monthly intervals
      let approximateMonths = watchedTotalCycles
      if (watchedIntervalType === 'weekly') {
        approximateMonths = Math.round((watchedTotalCycles * watchedIntervalValue * 7) / 30.44)
      } else if (watchedIntervalType === 'custom_days') {
        approximateMonths = Math.round((watchedTotalCycles * watchedIntervalValue) / 30.44)
      }
      form.setValue('duration_months', Math.max(1, approximateMonths))
    }
  }, [watchedTotalCycles, watchedIntervalType, watchedIntervalValue, form])

  async function onSubmit(data: CreateChitFundForm) {
    setIsLoading(true)
    try {
      // Ensure a system profile exists (no auth mode) and pick a creator id
      await ensureSystemProfile(supabase)
      let creatorId: string | null = await getAnyProfileId(supabase)

      // Create chit fund
      const { data: chitFund, error } = await supabase
        .from('chit_funds')
        .insert({
          name: data.name,
          total_amount: (watchedInstallment || 0) * watchedTotalCycles, // Base calculation - will grow with members
          installment_per_member: data.installment_per_member,
          duration_months: data.duration_months, // Keep for backward compatibility
          total_cycles: data.total_cycles,
          cycle_interval_type: data.cycle_interval_type,
          cycle_interval_value: data.cycle_interval_value,
          max_members: null, // No limit - fund grows with members
          start_date: data.start_date,
          status: 'planning',
          ...(creatorId ? { created_by: creatorId } : {}),
        })
        .select()
        .single()

      if (error) {
        console.error("Create chit fund error:", error)
        toast({
          title: "Error",
          description: (error as any)?.message || (error as any)?.details || "Failed to create chit fund. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Generate cycles for the chit fund using the new flexible interval logic
      const cycles = generateCycles(chitFund.id, {
        startDate: data.start_date,
        totalCycles: data.total_cycles,
        intervalType: data.cycle_interval_type,
        intervalValue: data.cycle_interval_value,
      })

      const { error: cyclesError } = await supabase
        .from('cycles')
        .insert(cycles)

      if (cyclesError) {
        console.error("Create cycles error:", cyclesError)
        // Don't fail the whole operation if cycles creation fails
        toast({
          title: "Warning",
          description: "Chit fund created but cycles generation failed. You can create them manually.",
          variant: "destructive",
        })
      }

      toast({
        title: "Success",
        description: `Chit fund "${data.name}" created successfully with ${data.total_cycles} cycles (${getIntervalDescription(data.cycle_interval_type, data.cycle_interval_value, data.total_cycles)})!`,
      })

      form.reset()
      setOpen(false)
      router.refresh()
      
    } catch (error) {
      console.error("Create chit fund catch error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Chit Fund</DialogTitle>
          <DialogDescription>
            Set up a new chit fund with flexible cycle intervals (weekly, monthly, or custom days).
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Chit Fund Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Monthly Savings Group 2025"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this chit fund..."
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Financial Details</h3>
              
              <FormField
                control={form.control}
                name="installment_per_member"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Installment Per Member (₹)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        disabled={isLoading}
                        {...field}
                        onFocus={(e) => {
                          // Auto-select all content when focused for better UX
                          e.target.select()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cycle Configuration */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Cycle Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="total_cycles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Total Cycles
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            disabled={isLoading}
                            {...field}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cycle_interval_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Interval Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interval type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INTERVAL_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cycle_interval_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Interval Value
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            disabled={isLoading}
                            {...field}
                            onFocus={(e) => e.target.select()}
                            placeholder={
                              watchedIntervalType === 'weekly' ? 'Weeks' :
                              watchedIntervalType === 'monthly' ? 'Months' : 'Days'
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Common interval presets */}
                {watchedIntervalType && COMMON_INTERVALS[watchedIntervalType] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 mb-2">Common presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_INTERVALS[watchedIntervalType].map((preset) => (
                        <Button
                          key={preset.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto py-1 px-2 text-xs bg-white hover:bg-blue-100"
                          onClick={() => form.setValue('cycle_interval_value', preset.value)}
                          disabled={isLoading}
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.label}</div>
                            <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cycle preview */}
                {watchedTotalCycles > 0 && watchedIntervalType && watchedIntervalValue > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900 mb-1">Cycle Schedule Preview:</p>
                    <p className="text-sm text-green-800">
                      {getIntervalDescription(watchedIntervalType, watchedIntervalValue, watchedTotalCycles)}
                    </p>
                  </div>
                )}
              </div>


              {/* Dynamic Fund Growth Info */}
              {watchedInstallment && watchedTotalCycles && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3">Fund Growth Model</h4>
                  <div className="text-sm text-green-800 space-y-2">
                    <div>
                      <span className="font-medium">Per Member Per Cycle:</span> ₹{(watchedInstallment || 0).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Total Cycles:</span> {watchedTotalCycles} cycles
                    </div>
                    <div className="text-xs text-green-600 mt-3">
                      🌱 <strong>No member limit!</strong> Fund value will grow automatically as more members join.
                      <br />💰 Each member contributes ₹{(watchedInstallment || 0).toLocaleString()} × {watchedTotalCycles} = ₹{((watchedInstallment || 0) * watchedTotalCycles).toLocaleString()} total
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Timeline</h3>
              
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      The first cycle will begin on this date. Subsequent cycles will follow your configured interval.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Chit Fund"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
