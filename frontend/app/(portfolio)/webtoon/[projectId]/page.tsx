import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { WebtoonPlanner } from '../webtoon-planner'

type WebtoonProject = {
  id: string
  cover_image: string | null
  title: string | null
  logline: string | null
  description: string | null
  planning: { content: string | null; attachments: string[] }
  character_sheet: { content: string | null; attachments: string[] }
  story: { content: string | null; attachments: string[] }
  episodes: Array<{
    id: string
    episode_number: number
    title: string | null
    thumbnail_url: string | null
    reading_mode: 'scroll' | 'page'
    manuscript_pages: string[]
    manuscript_url: string | null
    created_at: string
  }>
  created_at: string
  updated_at: string
}

export default function WebtoonProjectPage() {
  const params = useParams<{ projectId: string }>()
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
        console.error('Failed to load webtoon project:', error)
      })

    return () => {
      cancelled = true
    }
  }, [params.projectId])

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-[#003366]">
        웹툰 프로젝트를 불러오는 중...
      </div>
    )
  }

  return <WebtoonPlanner projectId={project.id} initialProject={project} />
}
