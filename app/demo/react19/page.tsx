import Link from 'next/link'
import { Suspense } from 'react'

// Demo component showing React 19 features
function FeatureCard({ title, description, codeExample }: {
  title: string
  description: string
  codeExample: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{codeExample}</code>
      </pre>
    </div>
  )
}

export default function React19DemoPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link href="/polls" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mb-4">
          ← Back to polls
        </Link>
        
        <h1 className="text-3xl font-bold mb-4">
          React 19 Features Demo with Context7 Documentation
        </h1>
        
        <p className="text-lg text-gray-600">
          This demo showcases the latest React 19 features using live documentation from Context7.
          The implementation demonstrates real-world usage of the <code className="bg-gray-100 px-2 py-1 rounded">use()</code> hook,
          enhanced Suspense boundaries, and Supabase real-time subscriptions.
        </p>
      </div>

      <div className="space-y-8">
        {/* Feature 1: use() Hook */}
        <section>
          <h2 className="text-2xl font-bold mb-4">1. React 19's use() Hook</h2>
          <p className="text-gray-600 mb-6">
            The <code className="bg-gray-100 px-2 py-1 rounded">use()</code> hook allows components to read promises directly within render,
            integrating seamlessly with Suspense boundaries. As documented by Context7:
          </p>
          
          <FeatureCard
            title="Reading Promises in Components"
            description="When use() encounters a promise, React will suspend rendering until the promise resolves."
            codeExample={`// React 19 - Direct promise consumption in render
function PollResults({ dataPromise }) {
  // use() suspends until promise resolves
  const pollData = use(dataPromise);
  
  return (
    <div>
      {pollData.options.map(option => (
        <div key={option.id}>{option.text}</div>
      ))}
    </div>
  );
}`}
          />
        </section>

        {/* Feature 2: Server Components with Streaming */}
        <section>
          <h2 className="text-2xl font-bold mb-4">2. Server Components with Streaming</h2>
          <p className="text-gray-600 mb-6">
            Server Components can initiate promises without awaiting them, passing them to Client Components
            for streaming. This pattern enables optimal loading performance.
          </p>
          
          <FeatureCard
            title="Streaming Pattern"
            description="Server Component starts data fetching but doesn't await, enabling progressive rendering."
            codeExample={`// Server Component
async function PollPage({ pollId }) {
  // Start fetching but don't await (enables streaming)
  const pollDataPromise = fetchPollData(pollId);
  
  return (
    <Suspense fallback={<Loading />}>
      {/* Pass promise to client component */}
      <PollResults dataPromise={pollDataPromise} />
    </Suspense>
  );
}`}
          />
        </section>

        {/* Feature 3: Actions with useTransition */}
        <section>
          <h2 className="text-2xl font-bold mb-4">3. Actions with useTransition</h2>
          <p className="text-gray-600 mb-6">
            React 19's Actions feature with useTransition automatically manages pending states
            for async operations, keeping the UI responsive during data mutations.
          </p>
          
          <FeatureCard
            title="Async Actions Pattern"
            description="useTransition automatically handles isPending state during async operations."
            codeExample={`// React 19 Actions pattern
function VoteControls() {
  const [isPending, startTransition] = useTransition();
  
  const handleVote = () => {
    startTransition(async () => {
      // Async operation - isPending is automatically managed
      await submitVote(selectedOption);
      // Broadcast update via Supabase
      await channel.send({
        type: 'broadcast',
        event: 'vote_cast',
        payload: { optionId: selectedOption }
      });
    });
  };
  
  return (
    <Button disabled={isPending}>
      {isPending ? 'Submitting...' : 'Submit Vote'}
    </Button>
  );
}`}
          />
        </section>

        {/* Feature 4: Supabase Real-time Integration */}
        <section>
          <h2 className="text-2xl font-bold mb-4">4. Supabase Real-time with React 19</h2>
          <p className="text-gray-600 mb-6">
            Combining Supabase's real-time features with React 19's patterns creates
            a powerful system for live updates with optimal UX.
          </p>
          
          <FeatureCard
            title="Real-time Updates with Presence"
            description="Track active users and broadcast updates to all connected clients."
            codeExample={`// Supabase real-time setup
const channel = supabase.channel('poll:updates', {
  config: {
    broadcast: { self: true, ack: true },
    presence: { key: 'user-session' }
  }
});

channel
  .on('broadcast', { event: 'vote_cast' }, (payload) => {
    // Update creates new promise for fresh data
    const newDataPromise = fetchUpdatedPoll();
    setDataPromise(newDataPromise);
  })
  .on('presence', { event: 'sync' }, () => {
    const viewers = channel.presenceState();
    setActiveViewers(Object.keys(viewers).length);
  })
  .subscribe();`}
          />
        </section>

        {/* Live Demo Link */}
        <section className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border border-blue-200">
          <h2 className="text-2xl font-bold mb-4">Try the Live Demo</h2>
          <p className="text-gray-700 mb-6">
            See all these React 19 features in action with our real-time poll system.
            Open multiple browser windows to experience the real-time synchronization!
          </p>
          
          <div className="flex gap-4">
            <Link 
              href="/polls/demo-react19"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Launch Live Demo
            </Link>
            
            <Link 
              href="/polls/create"
              className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create New Poll
            </Link>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Benefits of Using Context7</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">📚 Live Documentation</h3>
              <p className="text-gray-600">
                Context7 provided real-time access to the latest React 19 documentation,
                ensuring our implementation uses the most current patterns and best practices.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">🚀 Latest Features</h3>
              <p className="text-gray-600">
                With Context7, we could confidently use React 19's newest features like
                the use() hook, knowing we had accurate, up-to-date examples.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">🔄 Real-world Examples</h3>
              <p className="text-gray-600">
                Context7 provided practical code snippets showing how to combine
                React 19 with Supabase real-time features for production use.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">⚡ Faster Development</h3>
              <p className="text-gray-600">
                Having instant access to documentation and examples through Context7
                significantly accelerated our development process.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}