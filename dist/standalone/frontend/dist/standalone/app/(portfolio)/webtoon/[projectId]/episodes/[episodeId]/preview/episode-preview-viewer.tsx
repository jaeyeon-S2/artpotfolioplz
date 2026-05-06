'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EpisodeReadingMode = 'scroll' | 'page'

interface EpisodePreviewViewerProps {
  pages: string[]
  readingMode: EpisodeReadingMode
  episodeNumber: number
  episodeTitle: string | null
}

export function EpisodePreviewViewer({
  pages,
  readingMode,
  episodeNumber,
  episodeTitle,
}: EpisodePreviewViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    setCurrentIndex(0)
    setZoom(1)
  }, [pages, readingMode])

  useEffect(() => {
    if (readingMode !== 'page') {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setCurrentIndex((prev) => Math.max(prev - 1, 0))
        setZoom(1)
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setCurrentIndex((prev) => Math.min(prev + 1, pages.length - 1))
        setZoom(1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pages.length, readingMode])

  if (pages.length === 0) {
    return null
  }

  if (readingMode === 'scroll') {
    return (
      <div className="overflow-hidden rounded-lg border bg-background">
        {pages.map((url, index) => (
          <Image
            key={`${url}-${index}`}
            src={url}
            alt={`${episodeNumber}화 ${episodeTitle ? `${episodeTitle} ` : ''}원고 ${index + 1}`}
            width={1200}
            height={1600}
            className="block h-auto w-full object-contain"
          />
        ))}
      </div>
    )
  }

  const safeIndex = Math.min(currentIndex, pages.length - 1)
  const currentPage = pages[safeIndex]
  const canGoPrev = safeIndex > 0
  const canGoNext = safeIndex < pages.length - 1

  const goPrev = () => {
    if (!canGoPrev) return
    setCurrentIndex((prev) => prev - 1)
    setZoom(1)
  }

  const goNext = () => {
    if (!canGoNext) return
    setCurrentIndex((prev) => prev + 1)
    setZoom(1)
  }

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 1))
  const resetZoom = () => setZoom(1)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" onClick={goPrev} disabled={!canGoPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">
            {safeIndex + 1} / {pages.length}
          </span>
          <Button type="button" size="icon" variant="outline" onClick={goNext} disabled={!canGoNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="inline-flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" onClick={zoomOut} disabled={zoom <= 1}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-14 text-center text-sm text-foreground">{Math.round(zoom * 100)}%</span>
          <Button type="button" size="icon" variant="outline" onClick={zoomIn} disabled={zoom >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" onClick={resetZoom} disabled={zoom === 1}>
            <RotateCcw className="h-4 w-4 mr-2" />
            초기화
          </Button>
        </div>
      </div>

      <div className="relative h-[72vh] overflow-auto rounded-lg border bg-muted/10">
        <div className="flex min-h-full items-start justify-center p-4">
          <Image
            src={currentPage}
            alt={`${episodeNumber}화 ${episodeTitle ? `${episodeTitle} ` : ''}원고 ${safeIndex + 1}`}
            width={1200}
            height={1600}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="h-auto w-auto max-w-full transition-transform duration-150 ease-out"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        좌우 화살표 키로 페이지 이동, 확대/축소로 상세 확인이 가능합니다.
      </p>
    </div>
  )
}
