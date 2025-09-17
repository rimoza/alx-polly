'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Reply,
  MoreHorizontal,
  Edit2,
  Trash2,
  Pin,
  Flag,
  Heart,
  Smile,
  Frown,
  Angry,
  Laugh,
  Loader2
} from 'lucide-react'
import { ThreadedComment, ReactionType, CreateCommentRequest } from '@/lib/types/comments'
import { CommentService } from '@/lib/services/commentService'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CommentThreadProps {
  comment: ThreadedComment
  onUpdate: (comment: ThreadedComment) => void
  onDelete: (commentId: string) => void
  onReplyAdd: (parentId: string, reply: ThreadedComment) => void
  isAuthenticated: boolean
  depth?: number
}

const reactionIcons = {
  like: Heart,
  love: Heart,
  laugh: Laugh,
  angry: Angry,
  sad: Frown
}

const reactionColors = {
  like: 'text-red-500',
  love: 'text-pink-500',
  laugh: 'text-yellow-500',
  angry: 'text-red-600',
  sad: 'text-blue-500'
}

export function CommentThread({
  comment,
  onUpdate,
  onDelete,
  onReplyAdd,
  isAuthenticated,
  depth = 0
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const maxDepth = 3
  const canReply = depth < maxDepth && isAuthenticated

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    const request: CreateCommentRequest = {
      content: replyContent.trim(),
      parentId: comment.id
    }

    try {
      setSubmitting(true)
      const reply = await CommentService.createComment(comment.pollId, request)
      onReplyAdd(comment.id, reply)
      setReplyContent('')
      setIsReplying(false)
      toast({
        title: 'Success',
        description: 'Reply posted successfully!'
      })
    } catch (error) {
      console.error('Failed to create reply:', error)
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      return
    }

    try {
      setSubmitting(true)
      const updated = await CommentService.updateComment(comment.id, {
        content: editContent.trim()
      })
      onUpdate(updated)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Comment updated successfully!'
      })
    } catch (error) {
      console.error('Failed to update comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await CommentService.deleteComment(comment.id)
      onDelete(comment.id)
      toast({
        title: 'Success',
        description: 'Comment deleted successfully!'
      })
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive'
      })
    }
    setShowDeleteDialog(false)
  }

  const handlePin = async () => {
    try {
      const updated = await CommentService.togglePin(comment.id)
      onUpdate(updated)
      toast({
        title: 'Success',
        description: updated.isPinned ? 'Comment pinned!' : 'Comment unpinned!'
      })
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast({
        title: 'Error',
        description: 'Failed to pin comment. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) return

    try {
      // Optimistic update
      const newReactions = { ...comment.reactions }
      const reaction = newReactions[type]

      if (reaction.userReacted) {
        reaction.count--
        reaction.userReacted = false
      } else {
        reaction.count++
        reaction.userReacted = true
      }

      onUpdate({ ...comment, reactions: newReactions })

      // TODO: Implement reaction API calls
      // await ReactionService.toggleReaction(comment.id, type)
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      // Revert optimistic update
      onUpdate(comment)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'some time ago'
    }
  }

  return (
    <div className={cn('space-y-3', depth > 0 && 'ml-8 border-l border-gray-200 pl-4')}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.name || comment.author.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {comment.author.name || comment.author.email.split('@')[0]}
                </span>
                {comment.isPinned && (
                  <Pin className="h-3 w-3 text-blue-600" />
                )}
                <span className="text-xs text-gray-500">
                  {formatTime(comment.createdAt)}
                  {comment.updatedAt !== comment.createdAt && ' (edited)'}
                </span>
              </div>

              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {comment._metadata.canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {comment._metadata.canDelete && (
                      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                    {comment._metadata.canPin && (
                      <DropdownMenuItem onClick={handlePin}>
                        <Pin className="h-4 w-4 mr-2" />
                        {comment.isPinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                    )}
                    {comment._metadata.canReport && (
                      <DropdownMenuItem>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEdit} className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={2000}
                  className="min-h-[60px] resize-none"
                  disabled={submitting}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!editContent.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : null}
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-2">
            {/* Reactions */}
            <div className="flex items-center space-x-2">
              {Object.entries(comment.reactions).map(([type, reaction]) => {
                const Icon = reactionIcons[type as ReactionType]
                const isActive = reaction.userReacted

                return (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 px-2 text-xs',
                      isActive && reactionColors[type as ReactionType]
                    )}
                    onClick={() => handleReaction(type as ReactionType)}
                    disabled={!isAuthenticated}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {reaction.count > 0 && reaction.count}
                  </Button>
                )
              })}
            </div>

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsReplying(true)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {isReplying && (
            <form onSubmit={handleReply} className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={2000}
                className="min-h-[60px] resize-none"
                disabled={submitting}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent('')
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : null}
                  Reply
                </Button>
              </div>
            </form>
          )}

          {/* Render replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onReplyAdd={onReplyAdd}
                  isAuthenticated={isAuthenticated}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}