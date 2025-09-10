'use client'

import { use, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState, useRef } from 'react'

// Types for our poll data
interface PollOption {
  id: number
  text: string
  votes: number
  percentage: number
}

interface PollData {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  createdAt: string
  createdBy: string
  status: string
}

interface RealtimePollResultsProps {
  pollId: string
  initialDataPromise: Promise<PollData>
}

// Component that uses React 19's use() hook to consume the promise
function PollResultsContent({ dataPromise }: { dataPromise: Promise<PollData> }) {
  // React 19's use() hook - reads the promise value directly in render
  // As documented by Context7: "When `use` encounters a promise, React will suspend rendering until the promise resolves"
  const pollData = use(dataPromise)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{pollData.question}</h2>
      
      <div className="space-y-3">
        {pollData.options.map((option) => (
          <div key={option.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{option.text}</span>
              <span className="text-sm text-gray-600">
                {option.votes} votes ({option.percentage}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${option.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total votes: <span className="font-semibold">{pollData.totalVotes}</span>
        </p>
      </div>
    </div>
  )
}

// Loading skeleton component for Suspense fallback
function PollResultsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200"></div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  )
}

// Main component that manages real-time updates
export function RealtimePollResults({ pollId, initialDataPromise }: RealtimePollResultsProps) {
  const [currentDataPromise, setCurrentDataPromise] = useState(initialDataPromise)
  const [isStale, setIsStale] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Setup real-time subscription using patterns from Context7 documentation
    const setupRealtimeSubscription = async () => {
      // Create a channel for this specific poll
      const channel = supabase.channel(`poll:${pollId}:updates`, {
        config: {
          broadcast: { self: true, ack: true },
          presence: { key: `user-${Date.now()}` }
        }
      })

      channelRef.current = channel

      // Listen for vote updates via broadcast
      channel
        .on('broadcast', { event: 'vote_cast' }, (payload) => {
          console.log('Vote received:', payload)
          
          // Mark current data as stale while fetching new data
          setIsStale(true)
          
          // Create a new promise for updated data
          const newDataPromise = fetch(`/api/polls/${pollId}`)
            .then(res => res.json())
            .then(data => {
              setIsStale(false)
              return data
            })
          
          setCurrentDataPromise(newDataPromise)
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          console.log('Active viewers:', Object.keys(state).length)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to real-time updates')
            // Track our presence
            channel.track({ online_at: new Date().toISOString() })
          }
        })
    }

    setupRealtimeSubscription()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [pollId])

  return (
    <div className={`transition-opacity duration-300 ${isStale ? 'opacity-60' : 'opacity-100'}`}>
      {/* Suspense boundary as shown in Context7 React 19 documentation */}
      <Suspense fallback={<PollResultsSkeleton />}>
        <PollResultsContent dataPromise={currentDataPromise} />
      </Suspense>
      
      {isStale && (
        <div className="mt-2 text-sm text-blue-600 animate-pulse">
          Updating results...
        </div>
      )}
    </div>
  )
}