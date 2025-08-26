import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const poll = {
    id: id,
    question: "What's your favorite programming language?",
    options: [
      { id: 1, text: "JavaScript", votes: 45, percentage: 30 },
      { id: 2, text: "Python", votes: 60, percentage: 40 },
      { id: 3, text: "TypeScript", votes: 30, percentage: 20 },
      { id: 4, text: "Go", votes: 15, percentage: 10 }
    ],
    totalVotes: 150,
    createdAt: "2024-01-15",
    createdBy: "John Doe",
    status: "active"
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link href="/polls" className="text-blue-600 hover:text-blue-800">
          ← Back to all polls
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{poll.question}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Created by {poll.createdBy} on {poll.createdAt}
          </p>
        </div>

        <div className="space-y-4">
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="poll-option"
                    value={option.id}
                    className="h-4 w-4"
                  />
                  <span>{option.text}</span>
                </label>
                <span className="text-sm text-gray-600">
                  {option.votes} votes ({option.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total votes: {poll.totalVotes}
          </p>
          <Button>Submit Vote</Button>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Button variant="outline">Share Poll</Button>
        <Button variant="outline">Copy Link</Button>
        <Button variant="destructive">Close Poll</Button>
      </div>
    </div>
  )
}