'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Pin, Send, Loader2 } from 'lucide-react'
import { ThreadedComment, CreateCommentRequest } from '@/lib/types/comments'
import { CommentService } from '@/lib/services/commentService'
import { CommentThread } from './CommentThread'
import { useToast } from '@/hooks/use-toast'

interface CommentSectionProps {
  pollId: string
  isAuthenticated: boolean
}

export function CommentSection({ pollId, isAuthenticated }: CommentSectionProps) {
  const [comments, setComments] = useState<ThreadedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string>()
  const { toast } = useToast()

  const loadComments = useCallback(async (loadMore = false) => {
    try {
      setLoading(!loadMore)

      const result = await CommentService.getComments(pollId, {
        limit: 20,
        direction: 'after',
        cursor: loadMore ? cursor : undefined
      })

      if (loadMore) {
        setComments(prev => [...prev, ...result.comments])
      } else {
        setComments(result.comments)
      }

      setHasMore(result.pagination.hasMore)
      setCursor(result.pagination.nextCursor)
    } catch (error) {
      console.error('Failed to load comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [pollId, cursor, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || !isAuthenticated) return

    const request: CreateCommentRequest = {
      content: newComment.trim()
    }

    try {
      setSubmitting(true)

      // Optimistic update
      const tempId = `temp_${Date.now()}`
      const optimisticComment: ThreadedComment = {
        id: tempId,
        pollId,
        userId: 'current-user',
        content: newComment.trim(),
        isPinned: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: undefined,
        author: {
          id: 'current-user',
          email: 'current@user.com',
          name: 'You'
        },
        reactions: {
          like: { count: 0, userReacted: false },
          love: { count: 0, userReacted: false },
          laugh: { count: 0, userReacted: false },
          angry: { count: 0, userReacted: false },
          sad: { count: 0, userReacted: false }
        },
        replies: [],
        _metadata: {
          canEdit: true,
          canDelete: true,
          canPin: false,
          canReport: false
        }
      }

      setComments(prev => [optimisticComment, ...prev])
      setNewComment('')

      const savedComment = await CommentService.createComment(pollId, request)

      // Replace optimistic comment with real one
      setComments(prev =>
        prev.map(c => c.id === tempId ? savedComment : c)
      )

      toast({
        title: 'Success',
        description: 'Comment posted successfully!'
      })
    } catch (error) {
      console.error('Failed to create comment:', error)

      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => !c.id.startsWith('temp_')))

      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCommentUpdate = useCallback((updatedComment: ThreadedComment) => {
    setComments(prev => {
      const updateComment = (comments: ThreadedComment[]): ThreadedComment[] => {
        return comments.map(comment => {
          if (comment.id === updatedComment.id) {
            return { ...updatedComment, replies: comment.replies }
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateComment(comment.replies) }
          }
          return comment
        })
      }
      return updateComment(prev)
    })
  }, [])

  const handleCommentDelete = useCallback((commentId: string) => {
    setComments(prev => {
      const removeComment = (comments: ThreadedComment[]): ThreadedComment[] => {
        return comments
          .filter(comment => comment.id !== commentId)
          .map(comment => ({
            ...comment,
            replies: removeComment(comment.replies)
          }))
      }
      return removeComment(prev)
    })
  }, [])

  const handleReplyAdd = useCallback((parentId: string, reply: ThreadedComment) => {
    setComments(prev => {
      const addReply = (comments: ThreadedComment[]): ThreadedComment[] => {
        return comments.map(comment => {
          if (comment.id === parentId) {
            return { ...comment, replies: [reply, ...comment.replies] }
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: addReply(comment.replies) }
          }
          return comment
        })
      }
      return addReply(prev)
    })
  }, [])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  useEffect(() => {
    // Set up real-time subscriptions
    const subscription = CommentService.subscribeToComments(
      pollId,
      handleCommentUpdate,
      handleCommentDelete
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [pollId, handleCommentUpdate, handleCommentDelete])

  const totalComments = comments.reduce((count, comment) => {
    return count + 1 + comment.replies.length
  }, 0)

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({totalComments})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthenticated && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this poll..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={2000}
              className="min-h-[80px] resize-none"
              disabled={submitting}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {newComment.length}/2000 characters
              </span>
              <Button
                type="submit"
                disabled={!newComment.trim() || submitting}
                size="sm"
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post Comment
              </Button>
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sign in to join the discussion</p>
          </div>
        )}

        {loading && comments.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  onUpdate={handleCommentUpdate}
                  onDelete={handleCommentDelete}
                  onReplyAdd={handleReplyAdd}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>

            {comments.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No comments yet</p>
                <p>Be the first to share your thoughts!</p>
              </div>
            )}

            {hasMore && (
              <div className="text-center">
                <Button
                  onClick={() => loadComments(true)}
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load More Comments
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}