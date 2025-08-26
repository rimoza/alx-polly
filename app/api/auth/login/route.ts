import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  const user = {
    id: "user123",
    email,
    name: "Demo User",
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return NextResponse.json({
    user,
    token: "demo-token-123"
  })
}