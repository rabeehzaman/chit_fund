'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

const mockData = [
  { 
    name: 'Premium Fund', 
    collected: 485000, 
    target: 500000, 
    completion: 97,
    status: 'active',
    members: 25 
  },
  { 
    name: 'Standard Fund', 
    collected: 234000, 
    target: 300000, 
    completion: 78,
    status: 'active',
    members: 20 
  },
  { 
    name: 'Gold Fund', 
    collected: 890000, 
    target: 900000, 
    completion: 99,
    status: 'active',
    members: 30 
  },
  { 
    name: 'Silver Fund', 
    collected: 445000, 
    target: 600000, 
    completion: 74,
    status: 'active',
    members: 24 
  },
  { 
    name: 'Bronze Fund', 
    collected: 167000, 
    target: 200000, 
    completion: 84,
    status: 'active',
    members: 15 
  },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-blue-600">Collected: </span>
            {formatCurrency(data.collected)}
          </p>
          <p className="text-sm">
            <span className="text-green-600">Target: </span>
            {formatCurrency(data.target)}
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Completion: </span>
            {data.completion}%
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Members: </span>
            {data.members}
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function FundPerformanceChart() {
  const avgCompletion = mockData.reduce((sum, fund) => sum + fund.completion, 0) / mockData.length
  const topPerformer = mockData.reduce((prev, current) => 
    (prev.completion > current.completion) ? prev : current
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Fund Performance</CardTitle>
            <CardDescription>
              Collection progress across all active chit funds
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Avg. Completion</div>
            <div className="text-2xl font-bold">{avgCompletion.toFixed(1)}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value).replace('₹', '₹')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="collected" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Collected"
              />
              <Bar 
                dataKey="target" 
                fill="#e5e7eb" 
                radius={[4, 4, 0, 0]}
                name="Target"
                fillOpacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fund Status Summary */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Top Performer</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {topPerformer.name}
              </Badge>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">{topPerformer.completion}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Funds</div>
              <div className="text-xl font-bold">{mockData.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Members</div>
              <div className="text-xl font-bold">
                {mockData.reduce((sum, fund) => sum + fund.members, 0)}
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              Collections
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
              Targets
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}