import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PollCardProps {
  id: number
  question: string
  votes: number
  createdAt: string
  status: "active" | "closed"
}

export function PollCard({ id, question, votes, createdAt, status }: PollCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{question}</h3>
        <p className="mt-2 text-sm text-gray-600">
          {votes} votes • Created {createdAt}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          status === 'active' ? 'text-green-600' : 'text-gray-500'
        }`}>
          {status === 'active' ? 'Active' : 'Closed'}
        </span>
        
        <Link href={`/polls/${id}`}>
          <Button variant="outline" size="sm">
            View Poll
          </Button>
        </Link>
      </div>
    </div>
  )
}