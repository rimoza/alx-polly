'use client'

import { useState, useEffect, useCallback } from 'react'
import { PollAnalytics, AnalyticsFilter, EngagementMetrics } from '../types'
import { AnalyticsService } from '../services/analyticsService'

export function useAnalytics(pollId: string, filter?: AnalyticsFilter) {
  const [analytics, setAnalytics] = useState<PollAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await AnalyticsService.fetchPollAnalytics(pollId, filter)
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [pollId, filter])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { analytics, loading, error, refetch: fetchAnalytics }
}

export function useEngagementMetrics(pollIds: string[]) {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await AnalyticsService.fetchEngagementMetrics(pollIds)
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      } finally {
        setLoading(false)
      }
    }

    if (pollIds.length > 0) {
      fetchMetrics()
    }
  }, [pollIds])

  return { metrics, loading, error }
}