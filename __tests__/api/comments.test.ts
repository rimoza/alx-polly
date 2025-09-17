import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/polls/[pollId]/comments/route'
import { CommentService } from '@/lib/services/commentService'

// Mock CommentService
vi.mock('@/lib/services/commentService', () => ({
  CommentService: {
    getComments: vi.fn(),
    createComment: vi.fn()
  }
}))

// Helper function to create mock request
function createMockRequest(method: string, url: string, body?: any) {
  const request = new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json'
    }
  })
  return request
}

describe('/api/polls/[pollId]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/polls/[pollId]/comments', () => {
    it('should return comments with default pagination', async () => {
      const mockResponse = {
        comments: [
          {
            id: '1',
            content: 'Test comment',
            author: { id: 'user-1', email: 'test@example.com' }
          }
        ],
        pagination: {
          hasMore: false,
          totalCount: 1
        }
      }

      vi.mocked(CommentService.getComments).mockResolvedValue(mockResponse)

      const request = createMockRequest('GET', 'http://localhost:3000/api/polls/poll-1/comments')
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
      expect(CommentService.getComments).toHaveBeenCalledWith('poll-1', {
        limit: 20,
        direction: 'after',
        cursor: undefined
      })
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        comments: [],
        pagination: { hasMore: false, totalCount: 0 }
      }

      vi.mocked(CommentService.getComments).mockResolvedValue(mockResponse)

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/polls/poll-1/comments?limit=10&cursor=test-cursor&direction=before'
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await GET(request, { params })

      expect(response.status).toBe(200)
      expect(CommentService.getComments).toHaveBeenCalledWith('poll-1', {
        limit: 10,
        direction: 'before',
        cursor: 'test-cursor'
      })
    })

    it('should validate pagination parameters', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/polls/poll-1/comments?limit=invalid'
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request parameters')
    })

    it('should handle service errors', async () => {
      vi.mocked(CommentService.getComments).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('GET', 'http://localhost:3000/api/polls/poll-1/comments')
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch comments')
    })
  })

  describe('POST /api/polls/[pollId]/comments', () => {
    it('should create a new comment', async () => {
      const mockComment = {
        id: '1',
        content: 'New comment',
        author: { id: 'user-1', email: 'test@example.com' }
      }

      vi.mocked(CommentService.createComment).mockResolvedValue(mockComment as any)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'New comment' }
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockComment)
      expect(CommentService.createComment).toHaveBeenCalledWith('poll-1', {
        content: 'New comment'
      })
    })

    it('should create a reply comment', async () => {
      const mockReply = {
        id: '2',
        content: 'Reply comment',
        parentId: 'parent-1'
      }

      vi.mocked(CommentService.createComment).mockResolvedValue(mockReply as any)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'Reply comment', parentId: 'parent-1' }
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })

      expect(response.status).toBe(201)
      expect(CommentService.createComment).toHaveBeenCalledWith('poll-1', {
        content: 'Reply comment',
        parentId: 'parent-1'
      })
    })

    it('should validate request body', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: '' } // Empty content
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should validate content length', async () => {
      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'x'.repeat(2001) } // Too long
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle authentication errors', async () => {
      vi.mocked(CommentService.createComment).mockRejectedValue(
        new Error('User not authenticated')
      )

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'New comment' }
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('User not authenticated')
    })

    it('should handle authorization errors', async () => {
      vi.mocked(CommentService.createComment).mockRejectedValue(
        new Error('UNAUTHORIZED_ACCESS')
      )

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'New comment' }
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('UNAUTHORIZED_ACCESS')
    })

    it('should handle content validation errors', async () => {
      vi.mocked(CommentService.createComment).mockRejectedValue(
        new Error('CONTENT_TOO_LONG')
      )

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'New comment' }
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('CONTENT_TOO_LONG')
    })

    it('should handle rate limiting errors', async () => {
      vi.mocked(CommentService.createComment).mockRejectedValue(
        new Error('RATE_LIMIT_EXCEEDED')
      )

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/polls/poll-1/comments',
        { content: 'New comment' }
      )
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls/poll-1/comments', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' }
      })
      const params = Promise.resolve({ pollId: 'poll-1' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create comment')
    })
  })
})