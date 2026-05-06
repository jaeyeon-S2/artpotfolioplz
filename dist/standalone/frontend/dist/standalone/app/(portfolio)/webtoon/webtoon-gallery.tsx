'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Plus, Upload, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface WebtoonProjectSummary {
  id: string
  cover_image: string | null
  title: string | null
  logline: string | null
  description: string | null
  updated_at: string
}

interface WebtoonGalleryProps {
  initialProjects: WebtoonProjectSummary[]
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function WebtoonGallery({ initialProjects }: WebtoonGalleryProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)

  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [title, setTitle] = useState('')
  const [logline, setLogline] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')

  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        return null
      }

      const payload = await response.json()
      return typeof payload.url === 'string' ? payload.url : null
    } catch (error) {
      console.error('Cover upload failed:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadedUrl = await uploadFile(file)
    if (uploadedUrl) {
      setCoverImage(uploadedUrl)
    }
  }

  const resetCreateForm = () => {
    setTitle('')
    setLogline('')
    setDescription('')
    setCoverImage('')
  }

  const handleCreateProject = async () => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/webtoon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: toNullableText(title),
          logline: toNullableText(logline),
          description: toNullableText(description),
          cover_image: toNullableText(coverImage),
        }),
      })

      if (!response.ok) {
        return
      }

      const createdProject = (await response.json()) as WebtoonProjectSummary

      setProjects((prev) => [createdProject, ...prev])
      setOpenCreateDialog(false)
      resetCreateForm()
      router.refresh()
    } catch (error) {
      console.error('Create project failed:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-[#003366]">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-[#003366] drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">웹툰 기획</h1>
          </div>
          <Button onClick={() => setOpenCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            새 기획 만들기
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border bg-muted/50 py-24 px-6 text-center text-muted-foreground">
            아직 등록된 웹툰 기획이 없습니다. 새로운 기획을 만들어 보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/webtoon/${project.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto w-full max-w-[230px]"
              >
                <Card className="h-full overflow-hidden border-2 border-transparent hover:border-primary/30 hover:shadow-lg transition-all">
                  <div className="relative aspect-[210/297] bg-muted">
                    {project.cover_image ? (
                      <Image
                        src={project.cover_image}
                        alt={project.title || '웹툰 기획 표지'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        표지 없음
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-xl">
                      {project.title || '제목 없는 기획'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {project.logline || project.description || '로그라인 또는 작품 설명이 없습니다.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        수정일 {new Date(project.updated_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        열기
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>새 웹툰 기획 만들기</DialogTitle>
            <DialogDescription>
              기본 정보를 입력해 기획을 만든 뒤, 갤러리에서 선택하면 새 탭으로 상세 페이지가 열립니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>표지</Label>
              <input
                id="new-webtoon-cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <Button type="button" variant="outline" asChild disabled={isUploading}>
                <label htmlFor="new-webtoon-cover-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? '업로드 중...' : '표지 업로드'}
                </label>
              </Button>
              {coverImage && (
                <div className="relative w-28 h-40 rounded-md overflow-hidden border bg-muted">
                  <Image src={coverImage} alt="새 기획 표지" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-webtoon-title">제목</Label>
              <Input
                id="new-webtoon-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="작품 제목을 입력하세요"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-webtoon-logline">로그라인</Label>
              <Input
                id="new-webtoon-logline"
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="핵심 로그라인을 입력하세요"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-webtoon-description">작품설명</Label>
              <Textarea
                id="new-webtoon-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="작품 설명을 입력하세요"
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenCreateDialog(false)
                resetCreateForm()
              }}
            >
              취소
            </Button>
            <Button type="button" onClick={handleCreateProject} disabled={isCreating || isUploading}>
              {isCreating ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
