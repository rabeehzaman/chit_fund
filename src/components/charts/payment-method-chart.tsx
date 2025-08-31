'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Banknote, Smartphone } from 'lucide-react'

const data = [
  { name: 'Cash', value: 65, amount: 325000, color: '#ef4444' },
  { name: 'Bank Transfer', value: 28, amount: 140000, color: '#3b82f6' },
  { name: 'UPI/Digital', value: 7, amount: 35000, color: '#10b981' }
]

const COLORS = ['#ef4444', '#3b82f6', '#10b981']

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value}% • {formatCurrency(data.amount)}
        </p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 30
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return percent > 0.05 ? (
    <text 
      x={x} 
      y={y} 
      fill="#374151" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      className="font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null
}

export function PaymentMethodChart() {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Payment Methods</CardTitle>
        <CardDescription>
          Distribution of payment methods this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3 mt-4">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex items-center space-x-2">
                  {item.name === 'Cash' && <Banknote className="h-4 w-4 text-muted-foreground" />}
                  {item.name === 'Bank Transfer' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                  {item.name === 'UPI/Digital' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{item.value}%</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Total Collections</span>
            <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}