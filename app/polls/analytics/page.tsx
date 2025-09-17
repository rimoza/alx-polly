'use client'

import { useState, Suspense, useCallback } from 'react'
import { useAnalytics, useEngagementMetrics } from './hooks/useAnalytics'
import { EngagementMetrics } from './components/EngagementMetrics'
import { VotingTrends } from './components/VotingTrends'
import { PollComparison } from './components/PollComparison'
import { TimeFilter } from './components/TimeFilter'
import { AnalyticsService } from './services/analyticsService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  const [filter, setFilter] = useState({})
  const pollId = '1'

  const { analytics, loading: analyticsLoading } = useAnalytics(pollId, filter)
  const { metrics, loading: metricsLoading } = useEngagementMetrics([pollId])

  const growthRate = analytics ? AnalyticsService.calculateGrowthRate(analytics.votingTrends) : 0
  const peakTime = analytics ? AnalyticsService.findPeakVotingTime(analytics) : 'N/A'

  const handleFilterChange = useCallback((newFilter: { startDate?: Date; endDate?: Date }) => {
    setFilter(newFilter)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/polls">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Poll Analytics</h1>
              {analytics && (
                <p className="text-gray-600 mt-1">{analytics.pollQuestion}</p>
              )}
            </div>
          </div>
          <TimeFilter onFilterChange={handleFilterChange} />
        </div>
      </div>

      <div className="space-y-6">
        <EngagementMetrics metrics={metrics} loading={metricsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VotingTrends trends={analytics?.votingTrends || []} loading={analyticsLoading} />
          <PollComparison options={analytics?.optionBreakdown || []} loading={analyticsLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.totalVotes || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From {analytics?.uniqueVoters || 0} unique voters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Over selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Peak Voting Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {peakTime}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Most active period
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}