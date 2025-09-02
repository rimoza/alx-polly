import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  getPolls, 
  getPoll, 
  createPoll, 
  votePoll, 
  closePoll 
} from './polls'
import { Poll } from '@/types/poll'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Poll API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
  })

  describe('getPolls', () => {
    it('should fetch all polls successfully', async () => {
      const mockPolls: Poll[] = [
        {
          id: '1',
          question: 'What is your favorite color?',
          options: [
            { id: 'opt1', text: 'Red', votes: 5 },
            { id: 'opt2', text: 'Blue', votes: 3 }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user1',
          endsAt: undefined,
          status: 'active',
          totalVotes: 8,
          settings: {
            multipleChoice: false,
            requireAuth: false,
            hideResults: false,
            allowComments: false
          }
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPolls
      })

      const result = await getPolls()

      expect(mockFetch).toHaveBeenCalledWith('/api/polls')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockPolls)
    })

    it('should throw an error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(getPolls()).rejects.toThrow('Failed to fetch polls')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(getPolls()).rejects.toThrow('Network error')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls')
    })
  })

  describe('getPoll', () => {
    it('should fetch a single poll by id successfully', async () => {
      const mockPoll: Poll = {
        id: '123',
        question: 'Best programming language?',
        options: [
          { id: 'opt1', text: 'TypeScript', votes: 10 },
          { id: 'opt2', text: 'JavaScript', votes: 8 },
          { id: 'opt3', text: 'Python', votes: 12 }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user2',
        endsAt: undefined,
        status: 'active',
        totalVotes: 30,
        settings: {
          multipleChoice: true,
          requireAuth: true,
          hideResults: false,
          allowComments: true
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoll
      })

      const result = await getPoll('123')

      expect(mockFetch).toHaveBeenCalledWith('/api/polls/123')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockPoll)
    })

    it('should throw an error when poll is not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(getPoll('nonexistent')).rejects.toThrow('Failed to fetch poll')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls/nonexistent')
    })

    it('should handle invalid poll id format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(getPoll('invalid-id')).rejects.toThrow('Failed to fetch poll')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls/invalid-id')
    })
  })

  describe('createPoll', () => {
    it('should create a new poll successfully', async () => {
      const newPollData: Partial<Poll> = {
        question: 'What should we have for lunch?',
        options: [
          { id: 'opt1', text: 'Pizza', votes: 0 },
          { id: 'opt2', text: 'Burgers', votes: 0 },
          { id: 'opt3', text: 'Salad', votes: 0 }
        ],
        settings: {
          multipleChoice: false,
          requireAuth: false,
          hideResults: false
        }
      }

      const createdPoll: Poll = {
        ...newPollData,
        id: 'new-poll-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        endsAt: undefined,
        status: 'active',
        totalVotes: 0
      } as Poll

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdPoll
      })

      const result = await createPoll(newPollData)

      expect(mockFetch).toHaveBeenCalledWith('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPollData)
      })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(createdPoll)
    })

    it('should throw an error when poll creation fails', async () => {
      const invalidPollData: Partial<Poll> = {
        question: '', // Invalid: empty question
        options: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(createPoll(invalidPollData)).rejects.toThrow('Failed to create poll')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPollData)
      }))
    })

    it('should handle server errors during poll creation', async () => {
      const pollData: Partial<Poll> = {
        question: 'Valid question',
        options: [
          { id: 'opt1', text: 'Option 1', votes: 0 },
          { id: 'opt2', text: 'Option 2', votes: 0 }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(createPoll(pollData)).rejects.toThrow('Failed to create poll')
    })

    it('should handle polls with special characters', async () => {
      const pollWithSpecialChars: Partial<Poll> = {
        question: 'What\'s your favorite café? ☕',
        options: [
          { id: 'opt1', text: 'Starbucks®', votes: 0 },
          { id: 'opt2', text: 'Café Français', votes: 0 },
          { id: 'opt3', text: '日本の喫茶店', votes: 0 }
        ]
      }

      const createdPoll: Poll = {
        ...pollWithSpecialChars,
        id: 'special-chars-poll',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user',
        endsAt: undefined,
        status: 'active',
        totalVotes: 0,
        settings: {
          multipleChoice: false,
          requireAuth: false,
          hideResults: false,
          allowComments: false
        }
      } as Poll

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdPoll
      })

      const result = await createPoll(pollWithSpecialChars)

      expect(result).toEqual(createdPoll)
      expect(mockFetch).toHaveBeenCalledWith('/api/polls', expect.objectContaining({
        body: JSON.stringify(pollWithSpecialChars)
      }))
    })
  })

  describe('votePoll', () => {
    it('should submit a vote successfully', async () => {
      const pollId = 'poll-123'
      const optionId = 'option-456'
      const voteResponse = {
        success: true,
        message: 'Vote recorded successfully',
        updatedPoll: {
          id: pollId,
          // ... poll data with updated vote counts
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => voteResponse
      })

      const result = await votePoll(pollId, optionId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId })
      })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(voteResponse)
    })

    it('should throw an error when voting fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(votePoll('poll-123', 'invalid-option')).rejects.toThrow('Failed to submit vote')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls/poll-123/vote', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ optionId: 'invalid-option' })
      }))
    })

    it('should handle voting on closed polls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      })

      await expect(votePoll('closed-poll', 'option-1')).rejects.toThrow('Failed to submit vote')
    })

    it('should handle duplicate votes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict'
      })

      await expect(votePoll('poll-123', 'option-1')).rejects.toThrow('Failed to submit vote')
    })

    it('should handle voting with empty option id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(votePoll('poll-123', '')).rejects.toThrow('Failed to submit vote')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls/poll-123/vote', expect.objectContaining({
        body: JSON.stringify({ optionId: '' })
      }))
    })
  })

  describe('closePoll', () => {
    it('should close a poll successfully', async () => {
      const pollId = 'poll-to-close'
      const closeResponse = {
        success: true,
        message: 'Poll closed successfully',
        poll: {
          id: pollId,
          status: 'closed'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => closeResponse
      })

      const result = await closePoll(pollId)

      expect(mockFetch).toHaveBeenCalledWith(`/api/polls/${pollId}/close`, {
        method: 'POST'
      })
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(closeResponse)
    })

    it('should throw an error when closing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      })

      await expect(closePoll('not-my-poll')).rejects.toThrow('Failed to close poll')
      expect(mockFetch).toHaveBeenCalledWith('/api/polls/not-my-poll/close', {
        method: 'POST'
      })
    })

    it('should handle closing already closed polls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(closePoll('already-closed')).rejects.toThrow('Failed to close poll')
    })

    it('should handle closing non-existent polls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(closePoll('non-existent')).rejects.toThrow('Failed to close poll')
    })

    it('should handle network errors during poll closing', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      await expect(closePoll('poll-123')).rejects.toThrow('Network timeout')
    })
  })

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(getPolls()).rejects.toThrow('Invalid JSON')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      await expect(getPolls()).rejects.toThrow('Request timeout')
    })

    it('should handle CORS errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(getPolls()).rejects.toThrow('Failed to fetch')
    })
  })
})