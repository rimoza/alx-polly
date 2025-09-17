import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CommentService } from '@/lib/services/commentService'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  },
  channel: vi.fn()
}

const mockQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  single: vi.fn()
}

describe('CommentService', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)

    // Reset all mocks
    Object.values(mockQuery).forEach(mock => mock.mockReset())
    mockSupabase.from.mockReturnValue(mockQuery)

    // Chain methods properly
    mockQuery.select.mockReturnValue(mockQuery)
    mockQuery.eq.mockReturnValue(mockQuery)
    mockQuery.order.mockReturnValue(mockQuery)
    mockQuery.limit.mockReturnValue(mockQuery)
    mockQuery.lt.mockReturnValue(mockQuery)
    mockQuery.gt.mockReturnValue(mockQuery)
    mockQuery.insert.mockReturnValue(mockQuery)
    mockQuery.update.mockReturnValue(mockQuery)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getComments', () => {
    it('should fetch comments with default pagination', async () => {
      const mockComments = [
        {
          id: '1',
          poll_id: 'poll-1',
          user_id: 'user-1',
          content: 'Test comment',
          is_deleted: false,
          created_at: '2024-01-01T00:00:00Z',
          author: { id: 'user-1', email: 'test@example.com' },
          comment_reactions: []
        }
      ]

      mockQuery.single.mockResolvedValue({ data: mockComments, error: null, count: 1 })

      const result = await CommentService.getComments('poll-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('comments')
      expect(mockQuery.eq).toHaveBeenCalledWith('poll_id', 'poll-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('is_deleted', false)
      expect(mockQuery.limit).toHaveBeenCalledWith(20)
      expect(result.comments).toHaveLength(1)
    })

    it('should handle pagination with cursor', async () => {
      const mockComments = []
      mockQuery.single.mockResolvedValue({ data: mockComments, error: null, count: 0 })

      await CommentService.getComments('poll-1', {
        limit: 10,
        direction: 'after',
        cursor: '2024-01-01T00:00:00Z'
      })

      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(mockQuery.lt).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z')
    })

    it('should handle database errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(CommentService.getComments('poll-1')).rejects.toThrow('Failed to fetch comments: Database error')
    })
  })

  describe('createComment', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      })
    })

    it('should create a new comment', async () => {
      const mockComment = {
        id: '1',
        poll_id: 'poll-1',
        user_id: 'user-1',
        content: 'New comment',
        created_at: '2024-01-01T00:00:00Z',
        author: { id: 'user-1', email: 'test@example.com' }
      }

      mockQuery.single.mockResolvedValue({ data: mockComment, error: null })

      const result = await CommentService.createComment('poll-1', {
        content: 'New comment'
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('comments')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        poll_id: 'poll-1',
        user_id: 'user-1',
        parent_id: undefined,
        content: 'New comment'
      })
      expect(result.content).toBe('New comment')
    })

    it('should validate content length', async () => {
      await expect(CommentService.createComment('poll-1', {
        content: ''
      })).rejects.toThrow('CONTENT_TOO_LONG')

      await expect(CommentService.createComment('poll-1', {
        content: 'x'.repeat(2001)
      })).rejects.toThrow('CONTENT_TOO_LONG')
    })

    it('should validate parent comment', async () => {
      // Mock parent check - no parent found
      mockQuery.single
        .mockResolvedValueOnce({ data: null, error: null })

      await expect(CommentService.createComment('poll-1', {
        content: 'Reply comment',
        parentId: 'invalid-parent'
      })).rejects.toThrow('INVALID_PARENT')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      await expect(CommentService.createComment('poll-1', {
        content: 'New comment'
      })).rejects.toThrow('User not authenticated')
    })
  })

  describe('updateComment', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      })
    })

    it('should update a comment within edit window', async () => {
      const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago

      // Mock existing comment check
      mockQuery.single
        .mockResolvedValueOnce({
          data: { user_id: 'user-1', created_at: recentTime },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: '1',
            content: 'Updated content',
            author: { id: 'user-1', email: 'test@example.com' }
          },
          error: null
        })

      const result = await CommentService.updateComment('1', {
        content: 'Updated content'
      })

      expect(mockQuery.update).toHaveBeenCalledWith({
        content: 'Updated content',
        updated_at: expect.any(String)
      })
      expect(result.content).toBe('Updated content')
    })

    it('should reject updates outside edit window', async () => {
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago

      mockQuery.single.mockResolvedValueOnce({
        data: { user_id: 'user-1', created_at: oldTime },
        error: null
      })

      await expect(CommentService.updateComment('1', {
        content: 'Updated content'
      })).rejects.toThrow('Edit window expired')
    })

    it('should reject unauthorized updates', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { user_id: 'other-user', created_at: new Date().toISOString() },
        error: null
      })

      await expect(CommentService.updateComment('1', {
        content: 'Updated content'
      })).rejects.toThrow('UNAUTHORIZED_ACCESS')
    })
  })

  describe('deleteComment', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      })
    })

    it('should soft delete a comment', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null })

      await CommentService.deleteComment('1')

      expect(mockQuery.update).toHaveBeenCalledWith({ is_deleted: true })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      await expect(CommentService.deleteComment('1')).rejects.toThrow('User not authenticated')
    })
  })

  describe('togglePin', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'poll-creator' } }
      })
    })

    it('should toggle pin status for poll creator', async () => {
      // Mock comment with poll creator check
      mockQuery.single
        .mockResolvedValueOnce({
          data: {
            id: '1',
            is_pinned: false,
            poll: { creator_id: 'poll-creator' }
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: '1',
            is_pinned: true,
            author: { id: 'user-1', email: 'test@example.com' }
          },
          error: null
        })

      const result = await CommentService.togglePin('1')

      expect(mockQuery.update).toHaveBeenCalledWith({ is_pinned: true })
      expect(result.isPinned).toBe(true)
    })

    it('should reject pin by non-creators', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: {
          id: '1',
          poll: { creator_id: 'other-user' }
        },
        error: null
      })

      await expect(CommentService.togglePin('1')).rejects.toThrow('UNAUTHORIZED_ACCESS')
    })
  })

  describe('subscribeToComments', () => {
    it('should set up real-time subscription', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      const onUpdate = vi.fn()
      const onDelete = vi.fn()

      CommentService.subscribeToComments('poll-1', onUpdate, onDelete)

      expect(mockSupabase.channel).toHaveBeenCalledWith('poll_poll-1_comments')
      expect(mockChannel.on).toHaveBeenCalledWith('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: 'poll_id=eq.poll-1'
      }, expect.any(Function))
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })
})