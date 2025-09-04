"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, DollarSign, Clock, Info } from "lucide-react"

interface ViewChitFundDialogProps {
  children: React.ReactNode
  chitFund: {
    id: string
    name: string
    total_amount: string
    installment_per_member: string
    duration_months: number
    interest_rate: number
    status: string
    created_at: string
    chit_fund_members?: { length: number }[]
  }
}

export function ViewChitFundDialog({ children, chitFund }: ViewChitFundDialogProps) {
  const [open, setOpen] = useState(false)

  const memberCount = chitFund.chit_fund_members?.length || 0
  const totalAmount = parseFloat(chitFund.total_amount)
  const installmentAmount = parseFloat(chitFund.installment_per_member)

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'planning': return 'outline'
      default: return 'destructive'
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
            <Info className="h-5 w-5" />
            Chit Fund Details
          </DialogTitle>
          <DialogDescription>
            View complete information about this chit fund
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {chitFund.name}
                  <Badge variant={getBadgeVariant(chitFund.status)}>
                    {chitFund.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Created on {new Date(chitFund.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Monthly Installment</p>
                      <p className="text-2xl font-bold text-blue-600">₹{installmentAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-lg font-semibold">{chitFund.duration_months} months</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Members</p>
                      <p className="text-lg font-semibold">{memberCount} enrolled</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Interest Rate</p>
                  <p className="text-lg font-semibold">{chitFund.interest_rate}% per month</p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fund Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expected Monthly Collection</span>
                  <span className="font-semibold">₹{(installmentAmount * memberCount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Expected Collection</span>
                  <span className="font-semibold">₹{(totalAmount * memberCount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per Member Share</span>
                  <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}