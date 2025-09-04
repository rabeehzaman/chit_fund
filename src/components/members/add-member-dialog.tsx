"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { ensureSystemProfile, getAnyProfileId } from "@/lib/system"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, MapPin, CreditCard, UserCheck } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const addMemberSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  chit_fund_id: z.string().optional().or(z.literal("")),
  assigned_collector_id: z.string().optional(),
  auto_assign: z.boolean(),
})

type AddMemberForm = z.infer<typeof addMemberSchema>

interface AddMemberDialogProps {
  children: React.ReactNode
  chitFunds: Array<{
    id: string
    name: string
    status: string
  }>
  collectors: Array<{
    id: string
    full_name: string
  }>
}

export function AddMemberDialog({ children, chitFunds, collectors }: AddMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address: "",
      chit_fund_id: "",
      assigned_collector_id: "",
      auto_assign: false,
    },
  })

  const watchedChitFund = form.watch("chit_fund_id")
  const watchedAutoAssign = form.watch("auto_assign")

  async function onSubmit(data: AddMemberForm) {
    setIsLoading(true)
    try {
      // Check for duplicate member names first
      const { data: isDuplicate, error: duplicateCheckError } = await supabase
        .rpc('check_duplicate_member_name', { member_name: data.full_name })

      if (duplicateCheckError) {
        console.error("Duplicate check error:", duplicateCheckError)
        toast({
          title: "Error",
          description: "Failed to check for duplicate names. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (isDuplicate) {
        toast({
          title: "Duplicate Member Name", 
          description: `A member with the name "${data.full_name}" already exists. Please use a different name.`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Ensure a system profile exists (no auth mode) and pick a creator id
      await ensureSystemProfile(supabase)
      const creatorId = await getAnyProfileId(supabase)

      // Create member
      const memberPayload: any = {
        full_name: data.full_name,
        phone: data.phone || null,
        address: data.address || null,
      }
      if (creatorId) memberPayload.created_by = creatorId

      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert(memberPayload)
        .select()
        .single()

      if (memberError) {
        console.error("Create member error:", memberError)
        toast({
          title: "Error",
          description: (memberError as any)?.message || (memberError as any)?.details || "Failed to add member. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // If chit fund is selected, add member to chit fund
      if (data.chit_fund_id && data.auto_assign) {
        // Check if member can be added to this chit fund
        const { data: validationResult } = await supabase
          .rpc('can_add_member_to_chit_fund', {
            p_chit_fund_id: data.chit_fund_id,
            p_member_id: member.id
          })

        const validation = validationResult?.[0]
        if (!validation?.can_add) {
          toast({
            title: "Cannot Add Member",
            description: validation?.reason || "Member cannot be added to this chit fund",
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }

        const { error: assignmentError } = await supabase
          .from('chit_fund_members')
          .insert({
            chit_fund_id: data.chit_fund_id,
            member_id: member.id,
            assigned_collector_id: data.assigned_collector_id && data.assigned_collector_id !== 'none' ? data.assigned_collector_id : null,
            status: 'active',
          })

        if (assignmentError) {
          console.error("Assignment error:", assignmentError)
          toast({
            title: "Warning", 
            description: `Member "${data.full_name}" created but assignment to chit fund failed. You can assign manually later.`,
            variant: "destructive",
          })
          
          // For assignment errors, close dialog and refresh to show the member was created
          form.reset()
          setOpen(false)
          
          // Refresh after showing the warning message
          setTimeout(() => {
            router.refresh()
          }, 3000)
          setIsLoading(false)
          return
        } else {
          const selectedFund = chitFunds.find(fund => fund.id === data.chit_fund_id)
          const selectedCollector = data.assigned_collector_id && data.assigned_collector_id !== 'none' 
            ? collectors.find(collector => collector.id === data.assigned_collector_id)
            : null
          
          toast({
            title: "Success",
            description: `Member "${data.full_name}" added and assigned to "${selectedFund?.name}"${selectedCollector ? ` with collector "${selectedCollector.full_name}"` : ''}.`,
          })
        }
      } else {
        toast({
          title: "Success",
          description: `Member "${data.full_name}" added successfully. You can assign them to chit funds later.`,
        })
      }

      form.reset()
      setOpen(false)
      
      // Delay page refresh to allow toast messages to be seen
      setTimeout(() => {
        router.refresh()
      }, 2000)
      
    } catch (error) {
      console.error("Add member catch error:", error)
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
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Add a new member to the system and optionally assign them to a chit fund.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
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
                        placeholder="e.g. John Doe"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="e.g. +91 9876543210"
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 123 Main Street"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Assignment Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Assignment Options</h3>
              
              <FormField
                control={form.control}
                name="auto_assign"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Assign to Chit Fund Now
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Immediately assign this member to a chit fund. You can also do this later.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {watchedAutoAssign && (
                <div className="space-y-4 pl-8 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="chit_fund_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Chit Fund *</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a chit fund" />
                            </SelectTrigger>
                            <SelectContent>
                              {chitFunds.length > 0 ? (
                                chitFunds.map((fund) => (
                                  <SelectItem key={fund.id} value={fund.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{fund.name}</span>
                                      <span className="text-sm text-muted-foreground ml-2 capitalize">
                                        {fund.status}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  No chit funds available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Only planning and active chit funds are available
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedChitFund && (
                    <FormField
                      control={form.control}
                      name="assigned_collector_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Assign Collector (Optional)
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a collector (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No collector assigned</SelectItem>
                                {collectors.length > 0 ? (
                                  collectors.map((collector) => (
                                    <SelectItem key={collector.id} value={collector.id}>
                                      {collector.full_name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="unavailable" disabled>
                                    No collectors available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Assign a field collector to handle this member&apos;s payments
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
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
                {isLoading ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
