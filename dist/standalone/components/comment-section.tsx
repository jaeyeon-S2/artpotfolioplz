'use client'

import { useState, useOptimistic } from 'react'
import { Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

interface CommentSectionProps {
  postId: string
  initialComments: Comment[]
}

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState(initialComments)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim() || !content.trim() || isSubmitting) return

    setIsSubmitting(true)

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      author_name: authorName,
      content: content,
      created_at: new Date().toISOString(),
    }

    setComments((prev) => [tempComment, ...prev])

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          author_name: authorName,
          content: content,
        }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? newComment : c))
        )
        setContent('')
      } else {
        setComments((prev) => prev.filter((c) => c.id !== tempComment.id))
      }
    } catch (error) {
      console.error('Comment submit failed:', error)
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4">
        댓글 ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col gap-3">
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="이름"
            className="max-w-[200px]"
          />
          <div className="flex gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 작성하세요..."
              className="flex-1 min-h-[80px] resize-none"
            />
            <Button
              type="submit"
              size="icon"
              className="self-end"
              disabled={!authorName.trim() || !content.trim() || isSubmitting}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            아직 댓글이 없습니다. 첫 댓글을 작성해 보세요!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {comment.author_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
