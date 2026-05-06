import { addCommentToPost } from '@/lib/local-db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const postId = typeof payload.post_id === 'string' ? payload.post_id : ''
    // 닉네임 필드 호환성 (name 또는 author_name)
    const authorName = (typeof payload.author_name === 'string' ? payload.author_name : 
                        typeof payload.name === 'string' ? payload.name : '').trim()
    const content = typeof payload.content === 'string' ? payload.content.trim() : ''

    if (!postId || !authorName || !content) {
      return NextResponse.json({ error: 'Invalid comment payload' }, { status: 400 })
    }

    const comment = await addCommentToPost({
      post_id: postId,
      author_name: authorName,
      content,
    })

    if (!comment) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
