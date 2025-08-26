import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const featuredPolls = [
    { id: 1, question: "What's your preferred work environment?", votes: 234 },
    { id: 2, question: "Best time for team meetings?", votes: 156 },
    { id: 3, question: "Coffee or Tea?", votes: 89 }
  ]

  return (
    <div>
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-5xl font-bold">
            Create Polls, Gather Opinions, Make Decisions
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            ALX Polly makes it easy to create and share polls with your community
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/polls/create">
              <Button size="lg">Create Your First Poll</Button>
            </Link>
            <Link href="/polls">
              <Button variant="outline" size="lg">Browse Polls</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                  1
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Create a Poll</h3>
              <p className="text-gray-600">
                Set up your question and options in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                  2
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Share with Others</h3>
              <p className="text-gray-600">
                Send the link to your audience or embed it
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                  3
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">View Results</h3>
              <p className="text-gray-600">
                Watch real-time results as votes come in
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Featured Polls</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredPolls.map((poll) => (
              <div key={poll.id} className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold">{poll.question}</h3>
                <p className="mb-4 text-sm text-gray-600">{poll.votes} votes</p>
                <Link href={`/polls/${poll.id}`}>
                  <Button variant="outline" className="w-full">Vote Now</Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/polls">
              <Button>View All Polls</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-gray-600">
            Join thousands of users creating polls every day
          </p>
          <Link href="/register">
            <Button size="lg">Sign Up for Free</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
