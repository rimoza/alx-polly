'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptionBreakdown } from '../types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PollComparisonProps {
  options: OptionBreakdown[]
  loading?: boolean
}

export function PollComparison({ options, loading }: PollComparisonProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Option Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!options.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Option Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No option data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Option Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.optionId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{option.optionText}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {option.voteCount} votes ({option.percentage.toFixed(1)}%)
                  </span>
                  {getTrendIcon(option.trend)}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}