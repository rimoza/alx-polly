'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VotingTrend } from '../types'
import { useMemo, memo } from 'react'

interface VotingTrendsProps {
  trends: VotingTrend[]
  loading?: boolean
}

function VotingTrendsComponent({ trends, loading }: VotingTrendsProps) {
  const chartData = useMemo(() => {
    if (!trends.length) return { max: 0, points: [] }

    const max = Math.max(...trends.map(t => t.cumulativeVotes))
    const points = trends.map((trend, i) => ({
      x: (i / (trends.length - 1)) * 100,
      y: 100 - (trend.cumulativeVotes / max) * 100,
      votes: trend.cumulativeVotes,
      date: new Date(trend.timestamp).toLocaleDateString()
    }))

    return { max, points }
  }, [trends])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voting Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!trends.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voting Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No voting data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const pathData = chartData.points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path
              d={`${pathData} L 100 100 L 0 100 Z`}
              fill="url(#gradient)"
            />

            <path
              d={pathData}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />

            {chartData.points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="white"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="0.5"
                />
                <title>{`${point.date}: ${point.votes} votes`}</title>
              </g>
            ))}
          </svg>

          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
            <span>{chartData.points[0]?.date}</span>
            <span>{chartData.points[chartData.points.length - 1]?.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const VotingTrends = memo(VotingTrendsComponent)