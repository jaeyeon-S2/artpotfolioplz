'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface PostCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: 'webtoon' | 'works' | 'personal'
  onSuccess: () => void
}

export function PostCreateDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: PostCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        setThumbnailUrl(url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          setAdditionalImages((prev) => [...prev, url])
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          thumbnail_url: thumbnailUrl || null,
          additional_images: additionalImages,
        }),
      })

      if (response.ok) {
        resetForm()
        onSuccess()
      }
    } catch (error) {
      console.error('Create post failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setThumbnailUrl('')
    setAdditionalImages([])
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 게시물 작성</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시물 제목을 입력하세요"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="게시물 설명을 입력하세요"
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>썸네일 이미지</Label>
            {thumbnailUrl ? (
              <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setThumbnailUrl('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="thumbnail"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32"
                  asChild
                  disabled={isUploading}
                >
                  <label htmlFor="thumbnail" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6" />
                    <span>{isUploading ? '업로드 중...' : '썸네일 업로드'}</span>
                  </label>
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>추가 이미지</Label>
            <div className="grid grid-cols-3 gap-4">
              {additionalImages.map((url, index) => (
                <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Additional image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6"
                    onClick={() => removeAdditionalImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div>
                <input
                  type="file"
                  id="additional-images"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAdditionalImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full aspect-square"
                  asChild
                  disabled={isUploading}
                >
                  <label htmlFor="additional-images" className="cursor-pointer flex flex-col items-center justify-center gap-1">
                    <Plus className="w-5 h-5" />
                    <span className="text-xs">추가</span>
                  </label>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
