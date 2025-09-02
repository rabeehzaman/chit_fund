"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Edit, CalendarDays, DollarSign, Hash, Users } from "lucide-react"

const editChitFundSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  total_amount: z.coerce.number().min(1000, "Total amount must be at least ₹1,000").max(10000000, "Total amount must be less than ₹1,00,00,000"),
  installment_amount: z.coerce.number().min(100, "Installment must be at least ₹100").max(1000000, "Installment must be less than ₹10,00,000"),
  duration_months: z.coerce.number().min(1, "Duration must be at least 1 month").max(120, "Duration must be less than 120 months"),
  start_date: z.string().min(1, "Start date is required"),
  status: z.enum(['planning', 'active', 'completed', 'cancelled']),
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

type EditChitFundForm = z.infer<typeof editChitFundSchema>

interface EditChitFundDialogProps {
  children: React.ReactNode
  chitFund: {
    id: string
    name: string
    total_amount: string
    installment_amount: string
    duration_months: number
    start_date: string
    status: string
  }
}

export function EditChitFundDialog({ children, chitFund }: EditChitFundDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<EditChitFundForm>({
    resolver: zodResolver(editChitFundSchema),
    defaultValues: {
      name: chitFund.name,
      total_amount: parseFloat(chitFund.total_amount),
      installment_amount: parseFloat(chitFund.installment_amount),
      duration_months: chitFund.duration_months,
      start_date: chitFund.start_date,
      status: chitFund.status as any,
    },
  })

  // Watch values to provide real-time calculations
  const watchedInstallment = form.watch("installment_amount")
  const watchedDuration = form.watch("duration_months")
  const suggestedTotal = watchedInstallment * watchedDuration

  async function onSubmit(data: EditChitFundForm) {
    setIsLoading(true)
    try {
      // Update chit fund
      const { error } = await supabase
        .from('chit_funds')
        .update({
          name: data.name,
          total_amount: data.total_amount,
          installment_amount: data.installment_amount,
          duration_months: data.duration_months,
          start_date: data.start_date,
          status: data.status,
        })
        .eq('id', chitFund.id)

      if (error) {
        console.error("Update chit fund error:", error)
        toast({
          title: "Error",
          description: (error as any)?.message || (error as any)?.details || "Failed to update chit fund. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Chit fund updated successfully!",
      })

      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Chit Fund
          </DialogTitle>
          <DialogDescription>
            Update the chit fund details. Changes will affect all associated cycles and members.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
            {/* Fund Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Fund Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter chit fund name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Amount (₹)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100000"
                        {...field}
                        disabled={isLoading}
                        min="1000"
                        step="1000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field}
                        disabled={isLoading}
                        min="100"
                        step="100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration and Start Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Duration (Months)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="12"
                        {...field}
                        disabled={isLoading}
                        min="1"
                        max="120"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Calculation Helper */}
            {watchedInstallment > 0 && watchedDuration > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Suggested Total:</strong> ₹{suggestedTotal.toLocaleString()} 
                  ({watchedInstallment.toLocaleString()} × {watchedDuration} months)
                </p>
              </div>
            )}

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
                {isLoading ? "Updating..." : "Update Chit Fund"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}