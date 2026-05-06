import { createWebtoonProject, getWebtoonProjects } from '@/lib/local-db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const projects = await getWebtoonProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Get webtoon projects error:', error)
    return NextResponse.json({ error: 'Failed to load webtoon projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const project = await createWebtoonProject({
      title: typeof payload.title === 'string' ? payload.title : null,
      logline: typeof payload.logline === 'string' ? payload.logline : null,
      description:
        typeof payload.description === 'string' ? payload.description : null,
      cover_image:
        typeof payload.cover_image === 'string' ? payload.cover_image : null,
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Create webtoon project error:', error)
    return NextResponse.json({ error: 'Failed to create webtoon project' }, { status: 500 })
  }
}
