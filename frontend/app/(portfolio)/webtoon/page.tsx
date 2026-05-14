import { useEffect, useState } from 'react'
import { WebtoonGallery } from './webtoon-gallery'

type WebtoonProjectSummary = {
  id: string
  cover_image: string | null
  title: string | null
  logline: string | null
  description: string | null
  updated_at: string
}

export default function WebtoonPage() {
  const [projects, setProjects] = useState<WebtoonProjectSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/api/webtoon')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : [])
        }
      })
      .catch((error) => {
        console.error('Failed to load webtoon projects:', error)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8 text-[#003366]">
        웹툰 기획을 불러오는 중...
      </div>
    )
  }

  return <WebtoonGallery initialProjects={projects} />
}
