"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { UserCheck, Users, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const assignCollectorSchema = z.object({
  collector_id: z.string().min(1, "Please select a collector"),
  chit_fund_id: z.string().min(1, "Please select a chit fund"),
})

type AssignCollectorForm = z.infer<typeof assignCollectorSchema>

interface AssignCollectorDialogProps {
  children: React.ReactNode
  member: {
    id: string
    full_name: string
    chit_funds?: Array<{
      id: string
      name: string
    }>
  }
  collectors: Array<{
    id: string
    full_name: string
  }>
  chitFunds: Array<{
    id: string
    name: string
    status: string
  }>
}

export function AssignCollectorDialog({ 
  children, 
  member, 
  collectors, 
  chitFunds 
}: AssignCollectorDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<AssignCollectorForm>({
    resolver: zodResolver(assignCollectorSchema),
    defaultValues: {
      collector_id: "",
      chit_fund_id: "",
    },
  })

  const watchedChitFund = form.watch("chit_fund_id")

  async function onSubmit(data: AssignCollectorForm) {
    setIsLoading(true)
    try {
      // No auth mode: proceed directly

      // Check if member is already assigned to this chit fund
      const { data: existingAssignment, error: checkError } = await supabase
        .from('chit_fund_members')
        .select('id, assigned_collector_id')
        .eq('member_id', member.id)
        .eq('chit_fund_id', data.chit_fund_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Check assignment error:", checkError)
        toast({
          title: "Error",
          description: "Failed to check existing assignments.",
          variant: "destructive",
        })
        return
      }

      let result
      if (existingAssignment) {
        // Update existing assignment
        result = await supabase
          .from('chit_fund_members')
          .update({
            assigned_collector_id: data.collector_id
          })
          .eq('id', existingAssignment.id)
      } else {
        // Create new assignment
        result = await supabase
          .from('chit_fund_members')
          .insert({
            member_id: member.id,
            chit_fund_id: data.chit_fund_id,
            assigned_collector_id: data.collector_id,
            status: 'active'
          })
      }

      if (result.error) {
        console.error("Assignment error:", result.error)
        toast({
          title: "Error",
          description: "Failed to assign collector. Please try again.",
          variant: "destructive",
        })
        return
      }

      const selectedCollector = collectors.find(c => c.id === data.collector_id)
      const selectedChitFund = chitFunds.find(cf => cf.id === data.chit_fund_id)
      
      toast({
        title: "Success",
        description: `${member.full_name} assigned to collector "${selectedCollector?.full_name}" for chit fund "${selectedChitFund?.name}".`,
      })

      form.reset()
      setOpen(false)
      // Force a full page refresh to ensure fresh data
      window.location.reload()
      
    } catch (error) {
      console.error("Assign collector catch error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter chit funds - only show ones member is not already assigned to or can be reassigned
  const availableChitFunds = chitFunds.filter(cf => 
    cf.status === 'planning' || cf.status === 'active'
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Collector
          </DialogTitle>
          <DialogDescription>
            Assign a field collector to handle collections from <strong>{member.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Member Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Member: {member.full_name}</span>
            </div>
            {member.chit_funds && member.chit_funds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-muted-foreground">Currently in: </span>
                {member.chit_funds.map((fund) => (
                  <Badge key={fund.id} variant="outline" className="text-xs">
                    {fund.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="chit_fund_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Select Chit Fund *
                    </FormLabel>
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
                          {availableChitFunds.length > 0 ? (
                            availableChitFunds.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{fund.name}</span>
                                  <Badge 
                                    variant={fund.status === 'active' ? 'default' : 'outline'}
                                    className="ml-2"
                                  >
                                    {fund.status}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="unavailable" disabled>
                              No chit funds available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Select the chit fund for this collector assignment
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedChitFund && (
                <FormField
                  control={form.control}
                  name="collector_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Select Collector *
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a collector" />
                          </SelectTrigger>
                          <SelectContent>
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
                        This collector will handle collections from {member.full_name}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button type="submit" disabled={isLoading || !watchedChitFund}>
                  {isLoading ? "Assigning..." : "Assign Collector"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
