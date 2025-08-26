import { NextResponse } from "next/server"

export async function GET() {
  const polls = [
    {
      id: "1",
      question: "What's your favorite programming language?",
      options: [
        { id: "1", text: "JavaScript", votes: 45, percentage: 30 },
        { id: "2", text: "Python", votes: 60, percentage: 40 },
        { id: "3", text: "TypeScript", votes: 30, percentage: 20 },
        { id: "4", text: "Go", votes: 15, percentage: 10 }
      ],
      totalVotes: 150,
      createdAt: new Date("2024-01-15"),
      createdBy: "user1",
      status: "active"
    },
    {
      id: "2",
      question: "Best framework for web development?",
      options: [
        { id: "1", text: "React", votes: 50, percentage: 56 },
        { id: "2", text: "Vue", votes: 20, percentage: 22 },
        { id: "3", text: "Angular", votes: 19, percentage: 22 }
      ],
      totalVotes: 89,
      createdAt: new Date("2024-01-14"),
      createdBy: "user2",
      status: "active"
    }
  ]

  return NextResponse.json(polls)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newPoll = {
    id: Date.now().toString(),
    ...body,
    totalVotes: 0,
    createdAt: new Date(),
    status: "active"
  }

  return NextResponse.json(newPoll, { status: 201 })
}