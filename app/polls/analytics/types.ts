export interface PollAnalytics {
  pollId: string
  pollQuestion: string
  totalVotes: number
  uniqueVoters: number
  responseRate: number
  createdAt: string
  lastVoteAt: string
  votingTrends: VotingTrend[]
  optionBreakdown: OptionBreakdown[]
  peakVotingHours: HourlyActivity[]
}

export interface VotingTrend {
  timestamp: string
  cumulativeVotes: number
  newVotes: number
}

export interface OptionBreakdown {
  optionId: string
  optionText: string
  voteCount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface HourlyActivity {
  hour: number
  voteCount: number
  dayOfWeek: string
}

export interface AnalyticsFilter {
  startDate?: Date
  endDate?: Date
  pollIds?: string[]
  minVotes?: number
}

export interface EngagementMetrics {
  averageResponseTime: number
  completionRate: number
  bounceRate: number
  shareCount: number
}