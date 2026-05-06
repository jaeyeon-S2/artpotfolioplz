'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface GuestbookEntry {
  id: string
  author_name: string
  content: string
  created_at: string
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // 임시로 comments API를 활용하거나 별도 처리가 필요할 수 있음
  // 여기서는 로컬 DB의 comments 구조를 차용하여 /api/comments를 활용하는 예시
  // 실제로는 post_id가 'guestbook'인 전용 포스트를 만들거나 별도 API가 필요함

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/posts/guestbook')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch guestbook:', error)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: 'guestbook',
          author_name: name,
          content: content,
        }),
      })

      if (res.ok) {
        toast({ title: '방명록이 등록되었습니다.' })
        setName('')
        setContent('')
        fetchEntries()
      } else {
        toast({ title: '등록에 실패했습니다.', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: '오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-12">
      <div className="flex items-center justify-between mb-8 text-[#003366]">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-[#003366]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
            방명록
          </h1>
        </div>
      </div>
      
      <Card className="mb-10 bg-white/20 backdrop-blur-md border-white/30 rounded-[25px] overflow-hidden shadow-xl">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 flex gap-3">
              <Input
                placeholder="닉네임"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/50 border-white/30 focus:bg-white/80 rounded-xl w-[120px] h-9 text-xs"
                required
              />
              <Textarea
                placeholder="따뜻한 한마디를 남겨주세요!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-white/50 border-white/30 focus:bg-white/80 rounded-xl flex-1 h-9 py-2 text-xs resize-none"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-xl px-6 h-9 transition-all active:scale-95 shadow-md text-xs font-bold"
            >
              {isLoading ? '...' : '등록'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-20 text-[#003366]/60 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
            아직 작성된 방명록이 없습니다. 첫 번째 발자국을 남겨보세요!
          </div>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 px-5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#003366] text-sm">{entry.author_name}</span>
                  <span className="text-[10px] text-[#003366]/50">
                    {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-[#003366]/80 text-xs whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
