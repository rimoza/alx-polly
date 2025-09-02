import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GET, POST } from './route'
import { NextResponse } from 'next/server'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }),
  },
}))

describe('app/api/polls/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date.now() for consistent IDs in tests
    vi.spyOn(Date, 'now').mockReturnValue(1234567890)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/polls', () => {
    it('should return a list of polls with correct structure', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should return polls with all required fields', async () => {
      const response = await GET()
      const data = await response.json()

      const firstPoll = data[0]
      expect(firstPoll).toHaveProperty('id')
      expect(firstPoll).toHaveProperty('question')
      expect(firstPoll).toHaveProperty('options')
      expect(firstPoll).toHaveProperty('totalVotes')
      expect(firstPoll).toHaveProperty('createdAt')
      expect(firstPoll).toHaveProperty('createdBy')
      expect(firstPoll).toHaveProperty('status')
    })

    it('should return polls with valid option structure', async () => {
      const response = await GET()
      const data = await response.json()

      const firstPollOptions = data[0].options
      expect(Array.isArray(firstPollOptions)).toBe(true)
      expect(firstPollOptions.length).toBeGreaterThan(0)

      firstPollOptions.forEach((option: any) => {
        expect(option).toHaveProperty('id')
        expect(option).toHaveProperty('text')
        expect(option).toHaveProperty('votes')
        expect(option).toHaveProperty('percentage')
        expect(typeof option.votes).toBe('number')
        expect(typeof option.percentage).toBe('number')
      })
    })

    it('should return polls with correct sample data', async () => {
      const response = await GET()
      const data = await response.json()

      const firstPoll = data[0]
      expect(firstPoll.id).toBe('1')
      expect(firstPoll.question).toBe("What's your favorite programming language?")
      expect(firstPoll.totalVotes).toBe(150)
      expect(firstPoll.status).toBe('active')
      expect(firstPoll.options).toHaveLength(4)
    })

    it('should calculate vote percentages correctly', async () => {
      const response = await GET()
      const data = await response.json()

      const firstPoll = data[0]
      const totalPercentage = firstPoll.options.reduce(
        (sum: number, option: any) => sum + option.percentage, 
        0
      )
      expect(totalPercentage).toBe(100)
    })

    it('should return proper content-type header', async () => {
      const response = await GET()
      expect(response.headers.get('content-type')).toBe('application/json')
    })
  })

  describe('POST /api/polls', () => {
    it('should create a new poll with provided data', async () => {
      const newPollData = {
        question: 'What is your favorite color?',
        options: [
          { id: '1', text: 'Red', votes: 0 },
          { id: '2', text: 'Blue', votes: 0 },
          { id: '3', text: 'Green', votes: 0 }
        ],
        createdBy: 'testuser',
        settings: {
          multipleChoice: false,
          requireAuth: true,
          hideResults: false,
          allowComments: true
        }
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPollData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        ...newPollData,
        id: '1234567890',
        totalVotes: 0,
        status: 'active'
      })
    })

    it('should generate unique ID based on timestamp', async () => {
      const pollData = {
        question: 'Test poll',
        options: [
          { id: '1', text: 'Option 1', votes: 0 },
          { id: '2', text: 'Option 2', votes: 0 }
        ]
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.id).toBe('1234567890')
      expect(Date.now).toHaveBeenCalled()
    })

    it('should set default values for new poll', async () => {
      const minimalPollData = {
        question: 'Minimal poll',
        options: [
          { text: 'Yes' },
          { text: 'No' }
        ]
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(minimalPollData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.totalVotes).toBe(0)
      expect(data.status).toBe('active')
      expect(data.createdAt).toBeDefined()
      expect(new Date(data.createdAt)).toBeInstanceOf(Date)
    })

    it('should handle poll with special characters', async () => {
      const pollWithSpecialChars = {
        question: 'What\'s your favorite café? ☕',
        options: [
          { text: 'Starbucks®' },
          { text: 'Café Français' },
          { text: '日本の喫茶店' }
        ],
        createdBy: 'user123'
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollWithSpecialChars),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.question).toBe('What\'s your favorite café? ☕')
      expect(data.options[2].text).toBe('日本の喫茶店')
    })

    it('should preserve additional poll settings', async () => {
      const pollWithSettings = {
        question: 'Poll with settings',
        options: [
          { text: 'Option A' },
          { text: 'Option B' }
        ],
        settings: {
          multipleChoice: true,
          requireAuth: true,
          hideResults: true,
          allowComments: false
        },
        endsAt: '2024-12-31T23:59:59Z'
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollWithSettings),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.settings).toEqual({
        multipleChoice: true,
        requireAuth: true,
        hideResults: true,
        allowComments: false
      })
      expect(data.endsAt).toBe('2024-12-31T23:59:59Z')
    })

    it('should handle large poll with many options', async () => {
      const options = Array.from({ length: 10 }, (_, i) => ({
        id: `opt${i + 1}`,
        text: `Option ${i + 1}`,
        votes: 0
      }))

      const largePoll = {
        question: 'Poll with many options',
        options,
        createdBy: 'testuser'
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(largePoll),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.options).toHaveLength(10)
      expect(data.options[9].text).toBe('Option 10')
    })

    it('should return 201 status code for successful creation', async () => {
      const pollData = {
        question: 'Status code test',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' }
        ]
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollData),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(201)
    })

    it('should handle empty options array', async () => {
      const pollWithNoOptions = {
        question: 'Poll without options',
        options: []
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollWithNoOptions),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.options).toEqual([])
      expect(data.totalVotes).toBe(0)
    })

    it('should handle polls with metadata', async () => {
      const pollWithMetadata = {
        question: 'Poll with metadata',
        options: [
          { text: 'Yes', color: '#00FF00' },
          { text: 'No', color: '#FF0000' }
        ],
        description: 'This is a test poll with additional metadata',
        tags: ['test', 'sample', 'vitest'],
        visibility: 'public'
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollWithMetadata),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.description).toBe('This is a test poll with additional metadata')
      expect(data.tags).toEqual(['test', 'sample', 'vitest'])
      expect(data.visibility).toBe('public')
      expect(data.options[0].color).toBe('#00FF00')
    })

    it('should create poll with current timestamp', async () => {
      const fixedDate = new Date('2024-01-01T12:00:00Z')
      vi.spyOn(global, 'Date').mockImplementation(() => fixedDate as any)

      const pollData = {
        question: 'Timestamp test',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' }
        ]
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(pollData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.createdAt).toEqual(fixedDate.toISOString())
    })
  })

  describe('Integration Tests', () => {
    it('should maintain data consistency between GET and POST', async () => {
      // First, get existing polls
      const getResponse = await GET()
      const existingPolls = await getResponse.json()
      const existingPollCount = existingPolls.length

      // Create a new poll
      const newPoll = {
        question: 'Integration test poll',
        options: [
          { text: 'Option A' },
          { text: 'Option B' }
        ]
      }

      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        body: JSON.stringify(newPoll),
      })

      const postResponse = await POST(request)
      const createdPoll = await postResponse.json()

      // Verify the created poll has the same structure as GET polls
      expect(createdPoll).toHaveProperty('id')
      expect(createdPoll).toHaveProperty('question')
      expect(createdPoll).toHaveProperty('options')
      expect(createdPoll).toHaveProperty('totalVotes')
      expect(createdPoll).toHaveProperty('createdAt')
      expect(createdPoll).toHaveProperty('status')
    })

    it('should handle rapid consecutive POST requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const pollData = {
          question: `Concurrent poll ${i + 1}`,
          options: [
            { text: 'Yes' },
            { text: 'No' }
          ]
        }

        const request = new Request('http://localhost:3000/api/polls', {
          method: 'POST',
          body: JSON.stringify(pollData),
        })

        return POST(request)
      })

      const responses = await Promise.all(promises)
      const polls = await Promise.all(responses.map(r => r.json()))

      // All should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // Each should have unique data
      polls.forEach((poll, index) => {
        expect(poll.question).toBe(`Concurrent poll ${index + 1}`)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST request', async () => {
      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {]',
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle request with missing body', async () => {
      const request = new Request('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      })

      await expect(POST(request)).rejects.toThrow()
    })
  })
})