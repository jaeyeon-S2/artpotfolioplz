import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { EpisodePreviewViewer } from './episode-preview-viewer'

function getFileLabel(url: string, index: number): string {
  const fileName = url.split('/').pop()
  if (!fileName) {
    return `원고 페이지 ${index + 1}`
  }

  const decoded = decodeURIComponent(fileName)
  const cleaned = decoded.replace(/^\d+-/, '')
  return cleaned.length > 0 ? cleaned : `원고 페이지 ${index + 1}`
}

function getEpisodePages(episode: {
  reading_mode?: 'scroll' | 'page'
  manuscript_pages?: string[]
  manuscript_url?: string | null
  thumbnail_url?: string | null
}): string[] {
  const filteredPages = Array.isArray(episode.manuscript_pages)
    ? episode.manuscript_pages.filter(
        (item): item is string =>
          typeof item === 'string' &&
          item.length > 0 &&
          item !== episode.thumbnail_url,
      )
    : []

  if (filteredPages.length > 0) {
    return filteredPages
  }

  if (
    typeof episode.manuscript_url === 'string' &&
    episode.manuscript_url.length > 0 &&
    episode.manuscript_url !== episode.thumbnail_url
  ) {
    return [episode.manuscript_url]
  }

  return []
}

type WebtoonProject = {
  id: string
  episodes: Array<{
    id: string
    episode_number: number
    title: string | null
    thumbnail_url: string | null
    reading_mode?: 'scroll' | 'page'
    manuscript_pages?: string[]
    manuscript_url?: string | null
  }>
}

export default function WebtoonEpisodePreviewPage() {
  const params = useParams<{ projectId: string; episodeId: string }>()
  const [project, setProject] = useState<WebtoonProject | null>(null)

  useEffect(() => {
    if (!params.projectId) {
      return
    }

    let cancelled = false

    fetch(`/api/webtoon/${params.projectId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setProject(data?.id ? data : null)
        }
      })
      .catch((error) => {
        console.error('Failed to load webtoon preview data:', error)
      })

    return () => {
      cancelled = true
    }
  }, [params.projectId])

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
        원고를 불러오는 중...
      </div>
    )
  }

  const episode = project.episodes.find((item) => item.id === params.episodeId)

  if (!episode) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
        원고를 찾을 수 없습니다.
      </div>
    )
  }

  const pages = useMemo(() => getEpisodePages(episode), [episode])
  const readingMode = episode.reading_mode === 'page' ? 'page' : 'scroll'

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="space-y-1">
          <p className="text-xs tracking-[0.12em] text-muted-foreground">WEBTOON PREVIEW</p>
          <h1 className="text-2xl font-bold text-foreground">
            {episode.episode_number}화
            {episode.title ? ` - ${episode.title}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            형식: {readingMode === 'page' ? '페이지 만화' : '스크롤 웹툰'}
          </p>
        </header>

        {pages.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            등록된 원고가 없습니다.
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">파일 목록 ({pages.length}장)</p>
              <ol className="mt-2 space-y-1.5">
                {pages.map((url, index) => (
                  <li key={`${url}-${index}`} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="truncate">{getFileLabel(url, index)}</span>
                  </li>
                ))}
              </ol>
            </div>

            <EpisodePreviewViewer
              pages={pages}
              readingMode={readingMode}
              episodeNumber={episode.episode_number}
              episodeTitle={episode.title}
            />
          </>
        )}
      </div>
    </div>
  )
}
