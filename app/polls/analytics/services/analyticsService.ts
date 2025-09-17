import { PollAnalytics, AnalyticsFilter, EngagementMetrics, VotingTrend } from '../types'

export class AnalyticsService {
  private static readonly CACHE_KEY_PREFIX = 'analytics_'
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private static cache = new Map<string, { data: any; timestamp: number }>()

  private static generateMockTrends(days: number = 7): VotingTrend[] {
    const trends: VotingTrend[] = []
    const now = new Date()
    let cumulativeVotes = 0

    for (let i = days; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const newVotes = Math.floor(Math.random() * 50) + 10
      cumulativeVotes += newVotes

      trends.push({
        timestamp: date.toISOString(),
        cumulativeVotes,
        newVotes
      })
    }

    return trends
  }

  private static getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private static setCached(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  static async fetchPollAnalytics(pollId: string, filter?: AnalyticsFilter): Promise<PollAnalytics> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${pollId}_${JSON.stringify(filter || {})}`
    const cached = this.getCached<PollAnalytics>(cacheKey)

    if (cached) {
      return cached
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    const data: PollAnalytics = {
      pollId,
      pollQuestion: "What's your preferred development environment?",
      totalVotes: 342,
      uniqueVoters: 298,
      responseRate: 0.73,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastVoteAt: new Date().toISOString(),
      votingTrends: this.generateMockTrends(filter?.startDate && filter?.endDate
        ? Math.ceil((filter.endDate.getTime() - filter.startDate.getTime()) / (24 * 60 * 60 * 1000))
        : 7),
      optionBreakdown: [
        { optionId: '1', optionText: 'VS Code', voteCount: 156, percentage: 45.6, trend: 'up' },
        { optionId: '2', optionText: 'JetBrains IDEs', voteCount: 89, percentage: 26.0, trend: 'stable' },
        { optionId: '3', optionText: 'Vim/Neovim', voteCount: 67, percentage: 19.6, trend: 'up' },
        { optionId: '4', optionText: 'Other', voteCount: 30, percentage: 8.8, trend: 'down' }
      ],
      peakVotingHours: [
        { hour: 9, voteCount: 45, dayOfWeek: 'Monday' },
        { hour: 14, voteCount: 62, dayOfWeek: 'Tuesday' },
        { hour: 16, voteCount: 38, dayOfWeek: 'Wednesday' }
      ]
    }

    this.setCached(cacheKey, data)
    return data
  }

  static async fetchEngagementMetrics(pollIds: string[]): Promise<EngagementMetrics> {
    await new Promise(resolve => setTimeout(resolve, 600))

    return {
      averageResponseTime: 3.2,
      completionRate: 0.87,
      bounceRate: 0.13,
      shareCount: 45
    }
  }

  static calculateGrowthRate(trends: VotingTrend[]): number {
    if (trends.length < 2) return 0
    const firstDay = trends[0].cumulativeVotes
    const lastDay = trends[trends.length - 1].cumulativeVotes
    return ((lastDay - firstDay) / firstDay) * 100
  }

  static findPeakVotingTime(analytics: PollAnalytics): string {
    if (!analytics.peakVotingHours.length) return 'No data'
    const peak = analytics.peakVotingHours.reduce((max, current) =>
      current.voteCount > max.voteCount ? current : max
    )
    return `${peak.hour}:00 on ${peak.dayOfWeek}`
  }
}