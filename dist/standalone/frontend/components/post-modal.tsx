'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CommentSection } from '@/components/comment-section'

interface PostImage {
  id: string
  image_url: string
  sort_order: number
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

interface Post {
  id: string
  category: string
  title: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  post_images: PostImage[]
  comments: Comment[]
}

interface PostModalProps {
  post: Post | null
  onClose: () => void
}

export function PostModal({ post, onClose }: PostModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!post) return null

  const allImages = post.thumbnail_url
    ? [{ id: 'thumbnail', image_url: post.thumbnail_url, sort_order: -1 }, ...post.post_images]
    : post.post_images

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    )
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentImageIndex(0)
      onClose()
    }
  }

  return (
    <Dialog open={!!post} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 rounded-3xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold text-[#003366] mb-1">{post.title}</DialogTitle>
              <p className="text-xs text-[#003366]/50">
                {new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-2">
            {allImages.length > 0 && (
              <div className="space-y-4 mb-6">
                {allImages.map((img, idx) => (
                  <div key={img.id || idx} className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-muted/10">
                    <img
                      src={img.image_url}
                      alt={`${post.title} - ${idx + 1}`}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            )}

            {post.description && (
              <div className="mb-6 p-4 bg-white/40 rounded-2xl border border-white/20">
                <p className="text-[#003366]/80 whitespace-pre-wrap leading-relaxed">
                  {post.description}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
