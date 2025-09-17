import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '@/lib/services/commentService'
import { UpdateCommentRequest } from '@/lib/types/comments'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000)
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params
    const body = await request.json()

    const validatedData = updateCommentSchema.parse(body)

    const comment = await CommentService.updateComment(commentId, validatedData)

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      const statusCode = getErrorStatusCode(error.message)
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params

    await CommentService.deleteComment(commentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)

    if (error instanceof Error) {
      const statusCode = getErrorStatusCode(error.message)
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

function getErrorStatusCode(errorMessage: string): number {
  if (errorMessage.includes('not authenticated')) return 401
  if (errorMessage.includes('UNAUTHORIZED_ACCESS')) return 403
  if (errorMessage.includes('COMMENT_NOT_FOUND')) return 404
  if (errorMessage.includes('Edit window expired')) return 410

  return 500
}