import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommentSection } from '@/app/polls/[id]/components/CommentSection'
import { CommentService } from '@/lib/services/commentService'

// Mock the CommentService
vi.mock('@/lib/services/commentService', () => ({
  CommentService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    subscribeToComments: vi.fn()
  }
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

const mockComments = [
  {
    id: '1',
    pollId: 'poll-1',
    userId: 'user-1',
    content: 'This is a test comment',
    isPinned: false,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    parentId: undefined,
    author: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    },
    reactions: {
      like: { count: 0, userReacted: false },
      love: { count: 0, userReacted: false },
      laugh: { count: 0, userReacted: false },
      angry: { count: 0, userReacted: false },
      sad: { count: 0, userReacted: false }
    },
    replies: [],
    _metadata: {
      canEdit: true,
      canDelete: true,
      canPin: false,
      canReport: false
    }
  }
]

describe('CommentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock subscription
    vi.mocked(CommentService.subscribeToComments).mockReturnValue({
      unsubscribe: vi.fn()
    } as any)
  })

  it('renders loading state initially', async () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    // Should show loading skeletons
    expect(screen.getByText('Comments (0)')).toBeInTheDocument()
  })

  it('renders comments after loading', async () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: mockComments,
      pagination: { hasMore: false, totalCount: 1 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    await waitFor(() => {
      expect(screen.getByText('Comments (1)')).toBeInTheDocument()
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('shows comment form when authenticated', () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    expect(screen.getByPlaceholderText('Share your thoughts about this poll...')).toBeInTheDocument()
    expect(screen.getByText('Post Comment')).toBeInTheDocument()
  })

  it('shows sign in message when not authenticated', () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={false} />)

    expect(screen.getByText('Sign in to join the discussion')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Share your thoughts about this poll...')).not.toBeInTheDocument()
  })

  it('submits new comment', async () => {
    const mockNewComment = { ...mockComments[0], id: '2', content: 'New comment' }

    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    vi.mocked(CommentService.createComment).mockResolvedValue(mockNewComment)

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    const textarea = screen.getByPlaceholderText('Share your thoughts about this poll...')
    const submitButton = screen.getByText('Post Comment')

    // Type in textarea
    fireEvent.change(textarea, { target: { value: 'New comment' } })
    expect(textarea).toHaveValue('New comment')

    // Submit form
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(CommentService.createComment).toHaveBeenCalledWith('poll-1', {
        content: 'New comment'
      })
    })
  })

  it('validates comment length', () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    const textarea = screen.getByPlaceholderText('Share your thoughts about this poll...')
    const submitButton = screen.getByText('Post Comment')

    // Empty content should disable submit
    expect(submitButton).toBeDisabled()

    // Add content
    fireEvent.change(textarea, { target: { value: 'Valid comment' } })
    expect(submitButton).not.toBeDisabled()

    // Character counter should work
    expect(screen.getByText('13/2000 characters')).toBeInTheDocument()
  })

  it('shows optimistic updates', async () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    // Simulate slow API response
    vi.mocked(CommentService.createComment).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockComments[0]), 1000))
    )

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    const textarea = screen.getByPlaceholderText('Share your thoughts about this poll...')
    const submitButton = screen.getByText('Post Comment')

    fireEvent.change(textarea, { target: { value: 'Optimistic comment' } })
    fireEvent.click(submitButton)

    // Should show optimistic comment immediately
    await waitFor(() => {
      expect(screen.getByText('Optimistic comment')).toBeInTheDocument()
    })

    // Textarea should be cleared
    expect(textarea).toHaveValue('')
  })

  it('loads more comments', async () => {
    vi.mocked(CommentService.getComments)
      .mockResolvedValueOnce({
        comments: mockComments,
        pagination: { hasMore: true, totalCount: 10, nextCursor: 'cursor-1' }
      })
      .mockResolvedValueOnce({
        comments: [{ ...mockComments[0], id: '2', content: 'Second comment' }],
        pagination: { hasMore: false, totalCount: 10 }
      })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    await waitFor(() => {
      expect(screen.getByText('Load More Comments')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Load More Comments'))

    await waitFor(() => {
      expect(screen.getByText('Second comment')).toBeInTheDocument()
    })
  })

  it('shows empty state', async () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    await waitFor(() => {
      expect(screen.getByText('No comments yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share your thoughts!')).toBeInTheDocument()
    })
  })

  it('sets up real-time subscriptions', () => {
    vi.mocked(CommentService.getComments).mockResolvedValue({
      comments: [],
      pagination: { hasMore: false, totalCount: 0 }
    })

    render(<CommentSection pollId="poll-1" isAuthenticated={true} />)

    expect(CommentService.subscribeToComments).toHaveBeenCalledWith(
      'poll-1',
      expect.any(Function),
      expect.any(Function)
    )
  })
})