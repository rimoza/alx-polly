'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { logout } from "@/app/auth/actions"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // This will be handled by middleware redirect
  }
  const userStats = {
    totalPolls: 12,
    totalVotes: 489,
    activePolls: 3,
    closedPolls: 9,
  }

  const recentPolls = [
    { id: 1, question: "Best JavaScript framework?", votes: 45, status: "active" },
    { id: 2, question: "Favorite code editor?", votes: 123, status: "active" },
    { id: 3, question: "Tabs or Spaces?", votes: 89, status: "closed" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome, {user.email}!</h1>
        <form action={logout}>
          <Button variant="outline" type="submit">
            Sign Out
          </Button>
        </form>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Polls</p>
          <p className="mt-2 text-3xl font-bold">{userStats.totalPolls}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Votes</p>
          <p className="mt-2 text-3xl font-bold">{userStats.totalVotes}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Active Polls</p>
          <p className="mt-2 text-3xl font-bold">{userStats.activePolls}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Closed Polls</p>
          <p className="mt-2 text-3xl font-bold">{userStats.closedPolls}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Your Recent Polls</h2>
          <Link href="/polls/create">
            <Button size="sm">Create New</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {recentPolls.map((poll) => (
            <div
              key={poll.id}
              className="flex items-center justify-between border-b pb-4 last:border-b-0"
            >
              <div>
                <p className="font-medium">{poll.question}</p>
                <p className="text-sm text-gray-600">
                  {poll.votes} votes • Status: {poll.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/polls/${poll.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}