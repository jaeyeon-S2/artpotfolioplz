import { createPost, type PostCategory } from '@/lib/local-db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const VALID_CATEGORIES: PostCategory[] = ['webtoon', 'works', 'personal']

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const category = payload.category as PostCategory
    const title = typeof payload.title === 'string' ? payload.title.trim() : ''

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const post = await createPost({
      category,
      title,
      description:
        typeof payload.description === 'string' ? payload.description : null,
      thumbnail_url:
        typeof payload.thumbnail_url === 'string' ? payload.thumbnail_url : null,
      additional_images: Array.isArray(payload.additional_images)
        ? payload.additional_images.filter(
            (item: unknown): item is string =>
              typeof item === 'string' && item.trim().length > 0,
          )
        : [],
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
