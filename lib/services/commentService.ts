import { createClient } from '@/lib/supabase/client'
import {
  Comment,
  CommentWithAuthor,
  ThreadedComment,
  CommentPagination,
  CommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  ReactionSummary,
  CommentMetadata,
  CommentErrorCodes
} from '@/lib/types/comments'

export class CommentService {
  private static supabase = createClient()

  static async getComments(
    pollId: string,
    pagination: CommentPagination = { limit: 20, direction: 'after' }
  ): Promise<CommentsResponse> {
    try {
      const query = this.supabase
        .from('comments')
        .select(`
          *,
          author:user_id(id, email, name, avatar),
          comment_reactions(reaction_type, user_id)
        `)
        .eq('poll_id', pollId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(pagination.limit)

      if (pagination.cursor) {
        if (pagination.direction === 'after') {
          query.lt('created_at', pagination.cursor)
        } else {
          query.gt('created_at', pagination.cursor)
        }
      }

      const { data: comments, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch comments: ${error.message}`)
      }

      const threaded = this.buildCommentTree(comments || [])
      const hasMore = comments?.length === pagination.limit
      const nextCursor = comments?.[comments.length - 1]?.created_at

      return {
        comments: threaded,
        pagination: {
          hasMore,
          nextCursor: hasMore ? nextCursor : undefined,
          totalCount: count || 0
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw error
    }
  }

  static async createComment(
    pollId: string,
    request: CreateCommentRequest
  ): Promise<ThreadedComment> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Validate content length
    if (request.content.length < 1 || request.content.length > 2000) {
      throw new Error(CommentErrorCodes.CONTENT_TOO_LONG)
    }

    // Validate parent comment exists if parentId provided
    if (request.parentId) {
      const { data: parent } = await this.supabase
        .from('comments')
        .select('id, poll_id')
        .eq('id', request.parentId)
        .eq('is_deleted', false)
        .single()

      if (!parent || parent.poll_id !== pollId) {
        throw new Error(CommentErrorCodes.INVALID_PARENT)
      }
    }

    const { data: comment, error } = await this.supabase
      .from('comments')
      .insert({
        poll_id: pollId,
        user_id: user.id,
        parent_id: request.parentId,
        content: request.content.trim()
      })
      .select(`
        *,
        author:user_id(id, email, name, avatar)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`)
    }

    return this.enrichComment(comment)
  }

  static async updateComment(
    commentId: string,
    request: UpdateCommentRequest
  ): Promise<ThreadedComment> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Validate content length
    if (request.content.length < 1 || request.content.length > 2000) {
      throw new Error(CommentErrorCodes.CONTENT_TOO_LONG)
    }

    // Check if user can edit (owner + within 1 hour)
    const { data: existing } = await this.supabase
      .from('comments')
      .select('user_id, created_at')
      .eq('id', commentId)
      .single()

    if (!existing) {
      throw new Error(CommentErrorCodes.COMMENT_NOT_FOUND)
    }

    if (existing.user_id !== user.id) {
      throw new Error(CommentErrorCodes.UNAUTHORIZED_ACCESS)
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (new Date(existing.created_at) < hourAgo) {
      throw new Error('Edit window expired')
    }

    const { data: comment, error } = await this.supabase
      .from('comments')
      .update({
        content: request.content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        author:user_id(id, email, name, avatar)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`)
    }

    return this.enrichComment(comment)
  }

  static async deleteComment(commentId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Soft delete by setting is_deleted = true
    const { error } = await this.supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`)
    }
  }

  static async togglePin(commentId: string): Promise<ThreadedComment> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user is poll creator
    const { data: comment } = await this.supabase
      .from('comments')
      .select(`
        *,
        poll:poll_id(creator_id)
      `)
      .eq('id', commentId)
      .single()

    if (!comment || comment.poll.creator_id !== user.id) {
      throw new Error(CommentErrorCodes.UNAUTHORIZED_ACCESS)
    }

    const { data: updated, error } = await this.supabase
      .from('comments')
      .update({ is_pinned: !comment.is_pinned })
      .eq('id', commentId)
      .select(`
        *,
        author:user_id(id, email, name, avatar)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to toggle pin: ${error.message}`)
    }

    return this.enrichComment(updated)
  }

  private static buildCommentTree(flatComments: any[]): ThreadedComment[] {
    const commentMap = new Map<string, ThreadedComment>()
    const rootComments: ThreadedComment[] = []

    // First pass: create map of all comments
    flatComments.forEach(comment => {
      const enriched = this.enrichComment(comment)
      commentMap.set(comment.id, enriched)
    })

    // Second pass: build tree structure
    flatComments.forEach(comment => {
      const threadedComment = commentMap.get(comment.id)!

      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(threadedComment)
        }
      } else {
        rootComments.push(threadedComment)
      }
    })

    // Sort root comments by pinned status, then by creation date
    rootComments.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return rootComments
  }

  private static enrichComment(comment: any): ThreadedComment {
    // Build reaction summary
    const reactions: ReactionSummary = {
      like: { count: 0, userReacted: false },
      love: { count: 0, userReacted: false },
      laugh: { count: 0, userReacted: false },
      angry: { count: 0, userReacted: false },
      sad: { count: 0, userReacted: false }
    }

    const currentUserId = this.supabase.auth.getUser().then(({ data }) => data.user?.id)

    if (comment.comment_reactions) {
      comment.comment_reactions.forEach((reaction: any) => {
        const type = reaction.reaction_type as keyof ReactionSummary
        reactions[type].count++
        if (reaction.user_id === currentUserId) {
          reactions[type].userReacted = true
        }
      })
    }

    // Build metadata
    const metadata: CommentMetadata = {
      canEdit: false, // Will be set based on current user
      canDelete: false,
      canPin: false,
      canReport: true
    }

    return {
      id: comment.id,
      pollId: comment.poll_id,
      userId: comment.user_id,
      parentId: comment.parent_id,
      content: comment.content,
      isPinned: comment.is_pinned,
      isDeleted: comment.is_deleted,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: comment.author,
      reactions,
      replies: [],
      _metadata: metadata
    }
  }

  static subscribeToComments(
    pollId: string,
    onUpdate: (comment: ThreadedComment) => void,
    onDelete: (commentId: string) => void
  ) {
    return this.supabase
      .channel(`poll_${pollId}_comments`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `poll_id=eq.${pollId}`
      }, async (payload) => {
        // Fetch full comment with author data
        const { data: comment } = await this.supabase
          .from('comments')
          .select(`
            *,
            author:user_id(id, email, name, avatar)
          `)
          .eq('id', payload.new.id)
          .single()

        if (comment) {
          onUpdate(this.enrichComment(comment))
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'comments',
        filter: `poll_id=eq.${pollId}`
      }, async (payload) => {
        if (payload.new.is_deleted) {
          onDelete(payload.new.id)
        } else {
          const { data: comment } = await this.supabase
            .from('comments')
            .select(`
              *,
              author:user_id(id, email, name, avatar)
            `)
            .eq('id', payload.new.id)
            .single()

          if (comment) {
            onUpdate(this.enrichComment(comment))
          }
        }
      })
      .subscribe()
  }
}