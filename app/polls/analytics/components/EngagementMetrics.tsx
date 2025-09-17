'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Clock, Share2 } from 'lucide-react'
import { EngagementMetrics as EngagementMetricsType } from '../types'

interface EngagementMetricsProps {
  metrics: EngagementMetricsType | null
  loading?: boolean
}

export function EngagementMetrics({ metrics, loading }: EngagementMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  const metricCards = [
    {
      title: 'Avg Response Time',
      value: `${metrics.averageResponseTime}m`,
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Completion Rate',
      value: `${(metrics.completionRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Bounce Rate',
      value: `${(metrics.bounceRate * 100).toFixed(1)}%`,
      icon: Users,
      color: 'text-orange-600'
    },
    {
      title: 'Total Shares',
      value: metrics.shareCount.toString(),
      icon: Share2,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}