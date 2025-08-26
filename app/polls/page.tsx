import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PollsPage() {
  const polls = [
    {
      id: 1,
      question: "What's your favorite programming language?",
      votes: 150,
      createdAt: "2024-01-15",
      status: "active"
    },
    {
      id: 2,
      question: "Best framework for web development?",
      votes: 89,
      createdAt: "2024-01-14",
      status: "active"
    },
    {
      id: 3,
      question: "Tabs or Spaces?",
      votes: 342,
      createdAt: "2024-01-10",
      status: "closed"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Polls</h1>
        <Link href="/polls/create">
          <Button>Create New Poll</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{poll.question}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {poll.votes} votes • Created {poll.createdAt}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                poll.status === 'active' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {poll.status === 'active' ? 'Active' : 'Closed'}
              </span>
              
              <Link href={`/polls/${poll.id}`}>
                <Button variant="outline" size="sm">
                  View Poll
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}