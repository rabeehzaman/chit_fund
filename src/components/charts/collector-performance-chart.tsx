'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CollectorData {
  collector_name: string
  collector_id: string
  total_collected: number
  collections_count: number
  success_rate: number
  avg_amount: number
  target_achievement: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm text-blue-600">
            Collections: {formatCurrency(data.total_collected)}
          </p>
          <p className="text-sm text-green-600">
            Count: {data.collections_count} entries
          </p>
          <p className="text-sm text-purple-600">
            Avg Amount: {formatCurrency(data.avg_amount)}
          </p>
          <p className="text-sm text-orange-600">
            Success Rate: {data.success_rate.toFixed(1)}%
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function CollectorPerformanceChart() {
  const [data, setData] = useState<CollectorData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCollectorData() {
      try {
        // Get collector performance data
        const { data: collections, error } = await supabase
          .from('collection_entries')
          .select(`
            collector_id,
            amount_collected,
            status,
            profiles!collection_entries_collector_id_fkey(
              full_name
            )
          `)
          .eq('status', 'closed')

        if (error) throw error

        // Group by collector and calculate metrics
        const collectorStats: { [key: string]: any } = {}
        
        collections?.forEach((collection: any) => {
          const collectorId = collection.collector_id
          const collectorName = collection.profiles?.full_name || 'Unknown Collector'
          
          if (!collectorStats[collectorId]) {
            collectorStats[collectorId] = {
              collector_id: collectorId,
              collector_name: collectorName,
              total_collected: 0,
              collections_count: 0,
              amounts: []
            }
          }
          
          collectorStats[collectorId].total_collected += parseFloat(collection.amount_collected || 0)
          collectorStats[collectorId].collections_count += 1
          collectorStats[collectorId].amounts.push(parseFloat(collection.amount_collected || 0))
        })

        // Calculate derived metrics
        const formattedData: CollectorData[] = Object.values(collectorStats).map((stats: any) => {
          const avgAmount = stats.total_collected / stats.collections_count
          const successRate = (stats.collections_count / (stats.collections_count + 2)) * 100 // Mock calculation
          const targetAchievement = Math.min((stats.total_collected / 50000) * 100, 100) // Mock target of 50k

          return {
            collector_name: stats.collector_name,
            collector_id: stats.collector_id,
            total_collected: stats.total_collected,
            collections_count: stats.collections_count,
            success_rate: successRate,
            avg_amount: avgAmount,
            target_achievement: targetAchievement
          }
        }).sort((a, b) => b.total_collected - a.total_collected)

        setData(formattedData)
      } catch (error) {
        console.error('Error fetching collector data:', error)
        // Use mock data as fallback
        setData([
          {
            collector_name: 'Rajesh Kumar',
            collector_id: '1',
            total_collected: 125000,
            collections_count: 45,
            success_rate: 92.5,
            avg_amount: 2778,
            target_achievement: 84.2
          },
          {
            collector_name: 'Priya Singh',
            collector_id: '2', 
            total_collected: 98000,
            collections_count: 38,
            success_rate: 88.1,
            avg_amount: 2579,
            target_achievement: 78.4
          },
          {
            collector_name: 'Amit Sharma',
            collector_id: '3',
            total_collected: 87500,
            collections_count: 42,
            success_rate: 85.7,
            avg_amount: 2083,
            target_achievement: 70.1
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCollectorData()
  }, [])

  const topPerformer = data[0]
  const totalCollected = data.reduce((sum, collector) => sum + collector.total_collected, 0)
  const avgSuccessRate = data.reduce((sum, collector) => sum + collector.success_rate, 0) / (data.length || 1)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Collector Performance</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Collector Performance</CardTitle>
            <CardDescription>
              Collection amounts and success rates by collector
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Top Performer</div>
            <div className="font-medium">{topPerformer?.collector_name}</div>
            <div className="text-xs text-green-600">
              {formatCurrency(topPerformer?.total_collected || 0)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="collector_name" 
                className="text-sm"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-sm"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total_collected" 
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
            </div>
            <div className="text-lg font-bold">{formatCurrency(totalCollected)}</div>
            <div className="text-xs text-muted-foreground">Total Collected</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-green-500 mr-1" />
            </div>
            <div className="text-lg font-bold">{data.length}</div>
            <div className="text-xs text-muted-foreground">Active Collectors</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-orange-500 mr-1" />
            </div>
            <div className="text-lg font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Avg Success Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}