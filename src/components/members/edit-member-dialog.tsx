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
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, MapPin, Hash, CreditCard } from "lucide-react"

const editMemberSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  share_updates: z.array(z.object({
    chit_fund_member_id: z.string().uuid(),
    number_of_shares: z.number()
      .min(0.5, "Must have at least 0.5 shares")
      .max(1000, "Maximum 1000 shares allowed")
      .refine(
        (val) => (val * 4) % 1 === 0,
        { message: "Shares must be in 0.25 increments (e.g., 0.5, 0.75, 1.0, 1.25, 1.5)" }
      ),
  })).optional(),
})

type EditMemberForm = z.infer<typeof editMemberSchema>

interface EditMemberDialogProps {
  children: React.ReactNode
  member: {
    id: string
    full_name: string
    phone?: string | null
    address?: string | null
    chit_fund_members?: Array<{
      id: string
      chit_fund_id: string
      number_of_shares: number
      chit_funds: {
        id: string
        name: string
      }
    }> | null
  }
}

export function EditMemberDialog({ children, member }: EditMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      full_name: member.full_name,
      phone: member.phone || "",
      address: member.address || "",
      share_updates: member.chit_fund_members?.map(cfm => ({
        chit_fund_member_id: cfm.id,
        number_of_shares: cfm.number_of_shares,
      })) || [],
    },
  })

  // Reset form when member changes
  useEffect(() => {
    form.reset({
      full_name: member.full_name,
      phone: member.phone || "",
      address: member.address || "",
      share_updates: member.chit_fund_members?.map(cfm => ({
        chit_fund_member_id: cfm.id,
        number_of_shares: cfm.number_of_shares,
      })) || [],
    })
  }, [member, form])

  const onSubmit = async (values: EditMemberForm) => {
    setIsLoading(true)

    try {
      // Step 1: Update member basic info
      const { error: memberError } = await supabase
        .from('members')
        .update({
          full_name: values.full_name,
          phone: values.phone || null,
          address: values.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id)

      if (memberError) {
        console.error('Error updating member:', memberError)
        toast({
          title: "Error",
          description: memberError.message || "Failed to update member. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Step 2: Update shares for each chit fund assignment (parallel updates)
      if (values.share_updates && values.share_updates.length > 0) {
        const shareUpdatePromises = values.share_updates.map(update =>
          supabase
            .from('chit_fund_members')
            .update({
              number_of_shares: update.number_of_shares,
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.chit_fund_member_id)
        )

        const results = await Promise.all(shareUpdatePromises)
        const errors = results.filter(r => r.error)

        if (errors.length > 0) {
          console.error('Error updating shares:', errors)
          toast({
            title: "Partial Success",
            description: `Member updated but ${errors.length} share update(s) failed. Please try again.`,
            variant: "destructive",
          })
          setOpen(false)
          router.refresh()
          return
        }
      }

      toast({
        title: "Member updated successfully!",
        description: `${values.full_name} and their share assignments have been updated.`,
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Unexpected error:', error)
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
      <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Member
          </DialogTitle>
          <DialogDescription>
            Update member information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="9876543210"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Field */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main Street, City, State"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chit Fund Assignments & Shares Section */}
            {member.chit_fund_members && member.chit_fund_members.length > 0 && (
              <div className="space-y-4 pt-6 border-t">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5" />
                    Chit Fund Assignments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Update the number of shares for each chit fund assignment
                  </p>
                </div>

                <div className="space-y-3">
                  {member.chit_fund_members.map((cfm, index) => (
                    <div key={cfm.id} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{cfm.chit_funds.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Fund ID: {cfm.chit_funds.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`share_updates.${index}.number_of_shares`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Number of Shares *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.5"
                                max="1000"
                                step="0.25"
                                placeholder="1.0"
                                disabled={isLoading}
                                {...field}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value)
                                  field.onChange(isNaN(value) ? 0.5 : value)
                                }}
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              {field.value !== 1 ? (
                                <>
                                  Payment per cycle: <strong>{field.value}x</strong> the standard installment
                                </>
                              ) : (
                                'Standard single share payment per cycle'
                              )}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Assignments Message */}
            {(!member.chit_fund_members || member.chit_fund_members.length === 0) && (
              <div className="pt-6 border-t">
                <div className="text-center py-6 bg-muted/50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    This member is not assigned to any chit funds yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the &quot;Assign&quot; button from the members table to add them to a fund.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Member"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}