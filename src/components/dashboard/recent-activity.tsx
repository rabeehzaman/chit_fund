'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'collection' | 'approval' | 'member' | 'cycle' | 'alert'
  title: string
  description: string
  amount?: number
  timestamp: string
  status: 'success' | 'pending' | 'warning' | 'info'
  link?: string
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'collection',
    title: 'New Collection Entry',
    description: 'Rajesh Kumar paid ₹5,000 for Premium Fund Cycle 8',
    amount: 5000,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    status: 'success',
    link: '/collect'
  },
  {
    id: '2',
    type: 'approval',
    title: 'Closing Session Submitted',
    description: 'Collector submitted closing session for review',
    amount: 45000,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    status: 'pending',
    link: '/approvals'
  },
  {
    id: '3',
    type: 'cycle',
    title: 'Payout Processed',
    description: 'Gold Fund Cycle 5 winner selected - Priya Singh',
    amount: 85000,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'success',
    link: '/chit-funds'
  },
  {
    id: '4',
    type: 'alert',
    title: 'Payment Overdue',
    description: '3 members have payments overdue by more than 5 days',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    status: 'warning',
    link: '/arrears'
  },
  {
    id: '5',
    type: 'member',
    title: 'New Member Added',
    description: 'Amit Sharma joined Standard Fund',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    status: 'info',
    link: '/members'
  },
  {
    id: '6',
    type: 'collection',
    title: 'Collection Approved',
    description: 'Closing session for ₹32,000 approved',
    amount: 32000,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    status: 'success',
    link: '/closings'
  }
]

function getActivityIcon(type: ActivityItem['type'], status: ActivityItem['status']) {
  switch (type) {
    case 'collection':
      return status === 'success' ? 
        <CheckCircle className="h-4 w-4 text-green-500" /> : 
        <DollarSign className="h-4 w-4 text-blue-500" />
    case 'approval':
      return <Clock className="h-4 w-4 text-orange-500" />
    case 'member':
      return <Users className="h-4 w-4 text-blue-500" />
    case 'cycle':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'alert':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <CheckCircle className="h-4 w-4 text-gray-500" />
  }
}

function getStatusBadge(status: ActivityItem['status']) {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>
    case 'pending':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
    case 'warning':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Warning</Badge>
    case 'info':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

function getTimeAgo(timestamp: string) {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your chit fund system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/activity">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type, activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {activity.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{getTimeAgo(activity.timestamp)}</span>
                  {activity.amount && (
                    <span className="font-medium text-green-600">
                      {formatCurrency(activity.amount)}
                    </span>
                  )}
                </div>
              </div>
              {activity.link && (
                <div className="flex-shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={activity.link}>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/activity">
                View All Activities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}