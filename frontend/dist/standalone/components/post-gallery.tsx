'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Trash2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AdminPasswordDialog } from '@/components/admin-password-dialog'
import { PostModal } from '@/components/post-modal'
import { PostCreateDialog } from '@/components/post-create-dialog'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

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

interface PostGalleryProps {
  posts: Post[]
  category: 'webtoon' | 'works' | 'personal'
  categoryTitle: string
}

export function PostGallery({ posts, category, categoryTitle }: PostGalleryProps) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true')
    }
    checkAdmin()
    window.addEventListener('storage', checkAdmin)
    return () => window.removeEventListener('storage', checkAdmin)
  }, [])

  const handleCreateClick = () => {
    setShowCreateDialog(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    if (confirm('정말 삭제하시겠습니까?')) {
      handleDelete(postId)
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handlePostCreated = () => {
    setShowCreateDialog(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-[#003366]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#003366] drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
            {categoryTitle}
          </h1>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateClick} className="bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-full transition-all active:scale-95 shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            새 게시물
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
          <p className="text-lg mb-4">아직 게시물이 없습니다.</p>
          {isAdmin && (
            <Button variant="outline" onClick={handleCreateClick} className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              첫 게시물 작성하기
            </Button>
          )}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="break-inside-avoid group cursor-pointer overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/20"
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative bg-muted/20 overflow-hidden">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-muted-foreground/30">
                    <span className="text-xs">No Image</span>
                  </div>
                )}
                
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full scale-0 group-hover:scale-100 bg-red-500/80 hover:bg-red-600 shadow-lg"
                    onClick={(e) => handleDeleteClick(e, post.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* 개인작인 경우 제목을 완전히 숨김 */}
              {category !== ('personal' as any) && (
                <div className="p-4 text-center">
                  <h3 className="font-bold text-[#003366] truncate group-hover:text-[#0066CC] transition-colors text-sm">
                    {post.title}
                  </h3>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <PostModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      <PostCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        category={category}
        onSuccess={handlePostCreated}
      />
    </>
  )
}
