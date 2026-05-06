'use client'

import { useState, useEffect } from 'react'
import { PostGallery } from '@/components/post-gallery'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function WorksPage() {
  const [posts, setPosts] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/posts').then(res => res.json()).then(data => {
      setPosts(data.filter((p: any) => p.category === 'works'))
    })
  }, [])

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'storyboard', label: '콘티', tag: '#콘티' },
    { id: 'lineart', label: '선화', tag: '#선화' },
    { id: 'coloring', label: '채색', tag: '#채색' },
    { id: 'editing', label: '보정', tag: '#보정' },
  ]

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#003366]/10 pb-4 gap-4">
            <h1 className="text-3xl font-bold text-[#003366] drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
              작업물
            </h1>
            <TabsList className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full h-auto p-1 flex-wrap justify-center">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id} 
                  className="rounded-full px-4 py-1.5 data-[state=active]:bg-[#0066CC] data-[state=active]:text-white transition-all"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <PostGallery posts={posts} category="works" categoryTitle="" />
          </TabsContent>
          {categories.slice(1).map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0">
              <PostGallery 
                posts={posts.filter(p => (p.description || '').includes(cat.tag))} 
                category="works" 
                categoryTitle="" 
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
