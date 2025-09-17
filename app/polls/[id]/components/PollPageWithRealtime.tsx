import { Suspense } from 'react'
import { RealtimePollResults } from './RealtimePollResults'
import { VoteControls } from './VoteControls'
import { ActiveViewers } from './ActiveViewers'

// Simulated async function - in production this would fetch from Supabase
async function fetchPollData(pollId: string) {
  // Following React 19 Server Component pattern from Context7 docs:
  // "React Server Components primarily use async/await for data fetching"
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    id: pollId,
    question: "What's your favorite React 19 feature?",
    options: [
      { id: 1, text: "use() hook for promises", votes: 145, percentage: 35 },
      { id: 2, text: "Server Components", votes: 125, percentage: 30 },
      { id: 3, text: "Actions with useTransition", votes: 85, percentage: 20 },
      { id: 4, text: "Enhanced Suspense", votes: 65, percentage: 15 }
    ],
    totalVotes: 420,
    createdAt: "2024-01-15",
    createdBy: "React Developer",
    status: "active"
  }
}

export default async function PollPageWithRealtime({ pollId }: { pollId: string }) {
  // Server Component pattern: Start fetching but don't await
  // This enables streaming as documented in Context7:
  // "The promise is passed to a Client Component, which uses React's use() hook 
  // to await the promise on the client, enabling streaming"
  const pollDataPromise = fetchPollData(pollId)
  
  // We can also fetch other data in parallel
  const viewersPromise = fetchActiveViewers(pollId)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main poll results - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Live Poll Results</h1>
            
            {/* Pass the promise to client component for streaming */}
            <RealtimePollResults 
              pollId={pollId} 
              initialDataPromise={pollDataPromise} 
            />
          </div>

          {/* Vote controls section */}
          <div className="mt-6 rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
            <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 rounded" />}>
              <VoteControls pollId={pollId} />
            </Suspense>
          </div>
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* Active viewers using Presence */}
          <Suspense fallback={<ViewersSkeleton />}>
            <ActiveViewers viewersPromise={viewersPromise} pollId={pollId} />
          </Suspense>

          {/* Poll metadata */}
          <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
            <h3 className="font-semibold mb-3">Poll Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Status: <span className="text-green-600 font-medium">Active</span></p>
              <p>Created: January 15, 2024</p>
              <p>Type: Public Poll</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function for fetching active viewers
async function fetchActiveViewers(pollId: string) {
  await new Promise(resolve => setTimeout(resolve, 300))
  return {
    count: 12,
    recentJoins: ['User123', 'DevExpert', 'ReactFan']
  }
}

// Loading skeleton for viewers widget
function ViewersSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </div>
    </div>
  )
}