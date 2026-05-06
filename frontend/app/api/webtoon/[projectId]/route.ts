import {
  addWebtoonEpisodeToProject,
  deleteWebtoonEpisodeFromProject,
  getWebtoonProjectById,
  updateWebtoonEpisodeInProject,
  updateWebtoonProjectMeta,
  updateWebtoonProjectSection,
} from '@/lib/local-db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SECTION_KEYS = ['planning', 'character_sheet', 'story'] as const

type EpisodeReadingMode = 'scroll' | 'page'

type SectionKey = (typeof SECTION_KEYS)[number]

function parseEpisodeReadingMode(value: unknown): EpisodeReadingMode {
  return value === 'page' ? 'page' : 'scroll'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const project = await getWebtoonProjectById(projectId)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Get webtoon project error:', error)
    return NextResponse.json({ error: 'Failed to load webtoon project' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const payload = await request.json()

    if (payload.type === 'meta') {
      const project = await updateWebtoonProjectMeta(projectId, {
        cover_image:
          typeof payload.cover_image === 'string' ? payload.cover_image : null,
        title: typeof payload.title === 'string' ? payload.title : null,
        logline: typeof payload.logline === 'string' ? payload.logline : null,
        description:
          typeof payload.description === 'string' ? payload.description : null,
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, project })
    }

    if (payload.type === 'section') {
      const section = payload.section as SectionKey

      if (!SECTION_KEYS.includes(section)) {
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
      }

      const attachments = Array.isArray(payload.attachments)
        ? payload.attachments.filter(
            (item: unknown): item is string =>
              typeof item === 'string' && item.length > 0,
          )
        : []

      const project = await updateWebtoonProjectSection(projectId, {
        section,
        content: typeof payload.content === 'string' ? payload.content : null,
        attachments,
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, project })
    }

    if (payload.type === 'episode') {
      const episodeId =
        typeof payload.episode_id === 'string' ? payload.episode_id : ''
      if (!episodeId) {
        return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 })
      }

      const manuscriptPages = Array.isArray(payload.manuscript_pages)
        ? payload.manuscript_pages.filter(
            (item: unknown): item is string =>
              typeof item === 'string' && item.length > 0,
          )
        : []

      if (manuscriptPages.length === 0) {
        return NextResponse.json(
          { error: '원고 이미지를 1장 이상 유지해 주세요.' },
          { status: 400 },
        )
      }

      const project = await updateWebtoonEpisodeInProject(projectId, {
        episode_id: episodeId,
        title: typeof payload.title === 'string' ? payload.title : null,
        thumbnail_url:
          typeof payload.thumbnail_url === 'string' ? payload.thumbnail_url : null,
        reading_mode: parseEpisodeReadingMode(payload.reading_mode),
        manuscript_pages: manuscriptPages,
        manuscript_url: manuscriptPages[0] ?? null,
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Episode not found or payload is invalid' },
          { status: 404 },
        )
      }

      return NextResponse.json({ success: true, project })
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
  } catch (error) {
    console.error('Update webtoon project error:', error)
    return NextResponse.json({ error: 'Failed to update webtoon project' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const payload = await request.json()

    const episodeNumber = Number(payload.episode_number)
    if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
      return NextResponse.json({ error: 'Invalid episode number' }, { status: 400 })
    }

    const manuscriptPages = Array.isArray(payload.manuscript_pages)
      ? payload.manuscript_pages.filter(
          (item: unknown): item is string =>
            typeof item === 'string' && item.length > 0,
        )
      : []

    if (
      manuscriptPages.length === 0 &&
      typeof payload.manuscript_url === 'string' &&
      payload.manuscript_url.length > 0
    ) {
      manuscriptPages.push(payload.manuscript_url)
    }

    if (manuscriptPages.length === 0) {
      return NextResponse.json(
        { error: '원고 이미지를 1장 이상 업로드해 주세요.' },
        { status: 400 },
      )
    }

    const createdEpisode = await addWebtoonEpisodeToProject(projectId, {
      episode_number: episodeNumber,
      title: typeof payload.title === 'string' ? payload.title : null,
      thumbnail_url:
        typeof payload.thumbnail_url === 'string' ? payload.thumbnail_url : null,
      reading_mode: parseEpisodeReadingMode(payload.reading_mode),
      manuscript_pages: manuscriptPages,
      manuscript_url: manuscriptPages[0] ?? null,
    })

    if (!createdEpisode) {
      return NextResponse.json(
        { error: 'Episode number already exists or payload is invalid' },
        { status: 400 },
      )
    }

    return NextResponse.json(createdEpisode, { status: 201 })
  } catch (error) {
    console.error('Create webtoon episode error:', error)
    return NextResponse.json({ error: 'Failed to create webtoon episode' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const requestUrl = new URL(request.url)
    const episodeId = requestUrl.searchParams.get('episodeId')

    if (!episodeId) {
      return NextResponse.json({ error: 'Invalid episode id' }, { status: 400 })
    }

    const project = await deleteWebtoonEpisodeFromProject(projectId, episodeId)

    if (!project) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Delete webtoon episode error:', error)
    return NextResponse.json({ error: 'Failed to delete webtoon episode' }, { status: 500 })
  }
}
