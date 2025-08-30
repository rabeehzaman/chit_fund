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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { User } from "lucide-react"

const editUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["admin", "collector"], {
    required_error: "Please select a role",
  }),
  address: z.string().optional(),
})

type EditUserForm = z.infer<typeof editUserSchema>

interface EditUserDialogProps {
  children: React.ReactNode
  user: {
    id: string
    full_name: string
    phone?: string | null
    role: string
    address?: string | null
  }
}

export function EditUserDialog({ children, user }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: user.full_name,
      phone: user.phone || "",
      role: user.role as "admin" | "collector",
      address: user.address || "",
    },
  })

  // Reset form when user changes
  useEffect(() => {
    form.reset({
      fullName: user.full_name,
      phone: user.phone || "",
      role: user.role as "admin" | "collector",
      address: user.address || "",
    })
  }, [user, form])

  const onSubmit = async (values: EditUserForm) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          phone: values.phone || null,
          role: values.role,
          address: values.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating user:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to update user. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "User updated successfully!",
        description: `${values.fullName} has been updated.`,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
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

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
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

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="collector">Collector</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main St, City"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}