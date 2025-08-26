import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password, name } = await request.json()

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Email, password, and name are required" },
      { status: 400 }
    )
  }

  const user = {
    id: Date.now().toString(),
    email,
    name,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return NextResponse.json({
    user,
    token: `token-${Date.now()}`
  }, { status: 201 })
}