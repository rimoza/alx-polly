import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '@/lib/services/commentService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params

    const comment = await CommentService.togglePin(commentId)

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error toggling pin:', error)

    if (error instanceof Error) {
      const statusCode = getErrorStatusCode(error.message)
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    )
  }
}

function getErrorStatusCode(errorMessage: string): number {
  if (errorMessage.includes('not authenticated')) return 401
  if (errorMessage.includes('UNAUTHORIZED_ACCESS')) return 403
  if (errorMessage.includes('COMMENT_NOT_FOUND')) return 404

  return 500
}