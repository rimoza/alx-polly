import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '@/lib/services/commentService'
import { CreateCommentRequest, CommentPagination } from '@/lib/types/comments'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional()
})

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  direction: z.enum(['before', 'after']).default('after')
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params
    const { searchParams } = new URL(request.url)

    const paginationParams = {
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || '20',
      direction: searchParams.get('direction') || 'after'
    }

    const pagination = paginationSchema.parse(paginationParams)

    const result = await CommentService.getComments(pollId, pagination)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comments:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params
    const body = await request.json()

    const validatedData = createCommentSchema.parse(body)

    const comment = await CommentService.createComment(pollId, validatedData)

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Handle specific business logic errors
      const statusCode = getErrorStatusCode(error.message)
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

function getErrorStatusCode(errorMessage: string): number {
  if (errorMessage.includes('not authenticated')) return 401
  if (errorMessage.includes('UNAUTHORIZED_ACCESS')) return 403
  if (errorMessage.includes('CONTENT_TOO_LONG')) return 400
  if (errorMessage.includes('INVALID_PARENT')) return 400
  if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) return 429
  if (errorMessage.includes('POLL_CLOSED')) return 409

  return 500
}