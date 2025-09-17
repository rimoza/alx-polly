export type ReactionType = 'like' | 'love' | 'laugh' | 'angry' | 'sad'

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'off_topic' | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface Comment {
  id: string
  pollId: string
  userId: string
  parentId?: string
  content: string
  isPinned: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CommentWithAuthor extends Comment {
  author: User
}

export interface CommentReaction {
  id: string
  commentId: string
  userId: string
  reactionType: ReactionType
  createdAt: string
}

export interface CommentReport {
  id: string
  commentId: string
  reporterId: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  createdAt: string
}

export interface ReactionSummary {
  [K in ReactionType]: {
    count: number
    userReacted: boolean
  }
}

export interface CommentMetadata {
  canEdit: boolean
  canDelete: boolean
  canPin: boolean
  canReport: boolean
}

export interface ThreadedComment extends CommentWithAuthor {
  reactions: ReactionSummary
  replies: ThreadedComment[]
  _metadata: CommentMetadata
}

export interface OptimisticComment {
  id: string
  content: string
  author: User
  createdAt: string
  status: 'pending' | 'error' | 'success'
}

export interface CommentPagination {
  cursor?: string
  limit: number
  direction: 'before' | 'after'
}

export interface CommentsResponse {
  comments: ThreadedComment[]
  pagination: {
    hasMore: boolean
    nextCursor?: string
    totalCount: number
  }
}

export interface CreateCommentRequest {
  content: string
  parentId?: string
}

export interface UpdateCommentRequest {
  content: string
}

export interface CreateReactionRequest {
  reactionType: ReactionType
}

export interface CreateReportRequest {
  reason: ReportReason
  description?: string
}

export interface APIError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId: string
}

export const CommentErrorCodes = {
  COMMENT_NOT_FOUND: 'COMMENT_001',
  UNAUTHORIZED_ACCESS: 'COMMENT_002',
  CONTENT_TOO_LONG: 'COMMENT_003',
  RATE_LIMIT_EXCEEDED: 'COMMENT_004',
  POLL_CLOSED: 'COMMENT_005',
  INVALID_PARENT: 'COMMENT_006',
  SELF_REPLY_NOT_ALLOWED: 'COMMENT_007',
  COMMENT_DELETED: 'COMMENT_008',
  DUPLICATE_REACTION: 'COMMENT_009',
  DUPLICATE_REPORT: 'COMMENT_010'
} as const