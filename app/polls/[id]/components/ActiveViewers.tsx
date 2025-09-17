'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface ViewersData {
  count: number
  recentJoins: string[]
}

interface ActiveViewersProps {
  viewersPromise: Promise<ViewersData>
  pollId: string
}

export function ActiveViewers({ viewersPromise, pollId }: ActiveViewersProps) {
  // Using React 19's use() hook to read the promise
  const initialData = use(viewersPromise)
  
  const [viewers, setViewers] = useState(initialData.count)
  const [recentUsers, setRecentUsers] = useState(initialData.recentJoins)
  const [presenceState, setPresenceState] = useState<Record<string, any>>({})

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Setup presence tracking as shown in Context7 Supabase docs
    const channel = supabase.channel(`poll:${pollId}:presence`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setPresenceState(state)
        setViewers(Object.keys(state).length)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key)
        setRecentUsers(prev => [...prev.slice(-2), `User${Math.random().toString(36).substr(2, 5)}`])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track our own presence
          await channel.track({
            user_id: `user_${Date.now()}`,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [pollId])

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Active Viewers</h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{viewers}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {viewers === 1 ? 'You are' : `${viewers} people are`} viewing this poll
        </p>
        
        {recentUsers.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Recently joined:</p>
            <div className="flex flex-wrap gap-1">
              {recentUsers.slice(-3).map((user, idx) => (
                <span 
                  key={idx}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                >
                  {user}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}