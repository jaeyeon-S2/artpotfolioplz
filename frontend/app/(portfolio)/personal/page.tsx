'use client'

import { useState, useEffect } from 'react'
import { PostGallery } from '@/components/post-gallery'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PersonalPage() {
  const [posts, setPosts] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/posts').then(res => res.json()).then(data => {
      setPosts(data.filter((p: any) => p.category === 'personal'))
    })
  }, [])

  const comicPosts = posts.filter(p => (p.description || '').includes('#만화'))
  const illustrationPosts = posts.filter(p => !(p.description || '').includes('#만화'))

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-8 border-b border-[#003366]/10 pb-4">
            <h1 className="text-3xl font-bold text-[#003366] drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
              개인작
            </h1>
            <TabsList className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full h-10">
              <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-[#0066CC] data-[state=active]:text-white">전체</TabsTrigger>
              <TabsTrigger value="comic" className="rounded-full px-6 data-[state=active]:bg-[#0066CC] data-[state=active]:text-white">만화</TabsTrigger>
              <TabsTrigger value="illustration" className="rounded-full px-6 data-[state=active]:bg-[#0066CC] data-[state=active]:text-white">일러스트</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <PostGallery posts={posts} category="personal" categoryTitle="" />
          </TabsContent>
          <TabsContent value="comic" className="mt-0">
            <PostGallery posts={comicPosts} category="personal" categoryTitle="" />
          </TabsContent>
          <TabsContent value="illustration" className="mt-0">
            <PostGallery posts={illustrationPosts} category="personal" categoryTitle="" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
