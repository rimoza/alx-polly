'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'

interface VoteControlsProps {
  pollId: string
}

export function VoteControls({ pollId }: VoteControlsProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  
  // React 19's useTransition for Actions as documented in Context7:
  // "Using async transitions with Actions automatically manages the isPending state"
  const [isPending, startTransition] = useTransition()

  const handleVote = () => {
    if (!selectedOption) {
      setError('Please select an option')
      return
    }

    // Use startTransition for the async voting action
    startTransition(async () => {
      try {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Simulate API call to cast vote
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Broadcast the vote to all connected clients
        const channel = supabase.channel(`poll:${pollId}:updates`)
        
        await channel.send({
          type: 'broadcast',
          event: 'vote_cast',
          payload: {
            pollId,
            optionId: selectedOption,
            timestamp: new Date().toISOString()
          }
        })

        setHasVoted(true)
        setError(null)
      } catch (err) {
        setError('Failed to submit vote. Please try again.')
      }
    })
  }

  if (hasVoted) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Thank you for voting!</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Results are updating in real-time
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Cast Your Vote</h3>
        {isPending && (
          <span className="text-sm text-blue-600 animate-pulse">
            Submitting...
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {[
          { id: 1, text: "use() hook for promises" },
          { id: 2, text: "Server Components" },
          { id: 3, text: "Actions with useTransition" },
          { id: 4, text: "Enhanced Suspense" }
        ].map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${selectedOption === option.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'
              }
              ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="poll-option"
              value={option.id}
              checked={selectedOption === option.id}
              onChange={() => setSelectedOption(option.id)}
              disabled={isPending}
              className="h-4 w-4 text-blue-600"
            />
            <span className="flex-1">{option.text}</span>
          </label>
        ))}
      </div>

      <Button 
        onClick={handleVote}
        disabled={isPending || !selectedOption}
        className="w-full"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting Vote...
          </span>
        ) : (
          'Submit Vote'
        )}
      </Button>
    </div>
  )
}