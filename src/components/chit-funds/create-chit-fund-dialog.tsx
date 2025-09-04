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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { CalendarDays, DollarSign, Hash, Users } from "lucide-react"

const createChitFundSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  installment_per_member: z.union([z.coerce.number(), z.literal("")]).optional().refine((val) => {
    if (val === "" || val === undefined) return true
    return val >= 100 && val <= 1000000
  }, {
    message: "Installment per member must be between ₹100 and ₹10,00,000"
  }),
  duration_months: z.coerce.number().min(1, "Duration must be at least 1 month").max(120, "Duration must be less than 120 months"),
  max_members: z.coerce.number().min(1, "At least 1 member required").max(120, "Maximum 120 members allowed"),
  start_date: z.string().min(1, "Start date is required"),
  description: z.string().optional(),
}).refine(
  (data) => {
    // Validation: max_members should not exceed duration_months (traditional model)
    return data.max_members <= data.duration_months
  },
  {
    message: "Maximum members cannot exceed duration months (each member can win only once)",
    path: ["max_members"],
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
      duration_months: 12,
      max_members: 12,
      start_date: "",
      description: "",
    },
  })

  // Watch values to provide real-time calculations
  const watchedInstallment = form.watch("installment_per_member")
  const watchedDuration = form.watch("duration_months")
  const watchedMaxMembers = form.watch("max_members")

  // Dynamic calculations (handle undefined values)
  const maxPossibleMonthlyCollection = (watchedInstallment || 0) * watchedMaxMembers
  const maxPossibleFundValue = maxPossibleMonthlyCollection * watchedDuration

  // Auto-update max_members to match duration (traditional model)
  React.useEffect(() => {
    if (watchedDuration && watchedDuration !== watchedMaxMembers) {
      form.setValue('max_members', watchedDuration)
    }
  }, [watchedDuration, watchedMaxMembers, form])

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
          total_amount: maxPossibleFundValue, // Keep for backward compatibility, but will be calculated dynamically
          installment_per_member: data.installment_per_member,
          duration_months: data.duration_months,
          max_members: data.max_members,
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

      // Generate cycles for the chit fund
      const cycles = Array.from({ length: data.duration_months }, (_, index) => {
        const cycleDate = new Date(data.start_date)
        cycleDate.setMonth(cycleDate.getMonth() + index)
        
        return {
          chit_fund_id: chitFund.id,
          cycle_number: index + 1,
          cycle_date: cycleDate.toISOString().split('T')[0], // YYYY-MM-DD format
          total_amount: 0,
          status: index === 0 ? 'active' : 'upcoming'
        }
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
        description: `Chit fund "${data.name}" created successfully with ${data.duration_months} cycles!`,
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
            Set up a new chit fund with members and monthly cycles.
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="duration_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Duration (Months)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={120}
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
              </div>

              <FormField
                control={form.control}
                name="max_members"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Maximum Members Allowed
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
                        min={1}
                        max={120}
                        disabled={isLoading}
                        {...field}
                        onFocus={(e) => {
                          // Auto-select all content when focused for better UX
                          e.target.select()
                        }}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Each member can win only once. Traditionally equals duration months.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Calculation Display */}
              {maxPossibleFundValue > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Dynamic Fund Calculations</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Max Monthly Collection:</span>
                      <p className="text-blue-900">₹{maxPossibleMonthlyCollection.toLocaleString()}</p>
                      <p className="text-xs text-blue-600">{watchedMaxMembers} members × ₹{watchedInstallment}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Max Fund Value:</span>
                      <p className="text-blue-900">₹{maxPossibleFundValue.toLocaleString()}</p>
                      <p className="text-xs text-blue-600">If all {watchedMaxMembers} members join</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-600">
                    💡 Actual fund value will grow as members join the chit fund
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
                      The first cycle will begin on this date
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
