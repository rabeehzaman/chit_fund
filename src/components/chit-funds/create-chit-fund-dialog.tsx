"use client"

import { useState } from "react"
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
  total_amount: z.coerce.number().min(1000, "Total amount must be at least ₹1,000").max(10000000, "Total amount must be less than ₹1,00,00,000"),
  installment_amount: z.coerce.number().min(100, "Installment must be at least ₹100").max(1000000, "Installment must be less than ₹10,00,000"),
  duration_months: z.coerce.number().min(1, "Duration must be at least 1 month").max(120, "Duration must be less than 120 months"),
  start_date: z.string().min(1, "Start date is required"),
  description: z.string().optional(),
}).refine(
  (data) => {
    // Basic validation: total_amount should be roughly equal to installment_amount * duration_months
    // Allow some flexibility (±10%) for practical purposes
    const expected = data.installment_amount * data.duration_months
    const difference = Math.abs(data.total_amount - expected)
    const tolerance = expected * 0.1 // 10% tolerance
    return difference <= tolerance
  },
  {
    message: "Total amount should roughly equal installment amount × duration months",
    path: ["total_amount"],
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
      total_amount: 0,
      installment_amount: 0,
      duration_months: 12,
      start_date: "",
      description: "",
    },
  })

  // Watch values to provide real-time calculations
  const watchedInstallment = form.watch("installment_amount")
  const watchedDuration = form.watch("duration_months")
  const suggestedTotal = watchedInstallment * watchedDuration

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
          total_amount: data.total_amount,
          installment_amount: data.installment_amount,
          duration_months: data.duration_months,
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
      // Force a full page refresh to ensure fresh data
      window.location.reload()
      
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
                  name="installment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Monthly Installment (₹)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000"
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Total Fund Amount (₹)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={suggestedTotal > 0 ? suggestedTotal.toString() : "60000"}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    {suggestedTotal > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Suggested: ₹{suggestedTotal.toLocaleString()} (based on installment × duration)
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
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
