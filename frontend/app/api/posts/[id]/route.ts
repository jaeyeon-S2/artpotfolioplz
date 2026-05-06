import { deletePostById } from '@/lib/local-db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // guestbook 전용 처리
    if (id === 'guestbook') {
      const { getPostsByCategory } = await import('@/lib/local-db')
      const posts = await getPostsByCategory('personal' as any)
      const guestbook = posts.find(p => p.id === 'guestbook')
      
      if (!guestbook) {
        return NextResponse.json({ id: 'guestbook', comments: [] })
      }
      return NextResponse.json(guestbook)
    }

    // 기존 로직... (필요 시 구현)
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const deleted = await deletePostById(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
