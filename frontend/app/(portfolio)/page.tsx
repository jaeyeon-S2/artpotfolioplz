'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

  const categories = [
    {
      title: '웹툰 기획',
      href: '/webtoon',
    },
    {
      title: '작업물',
      href: '/works',
    },
    {
      title: '개인작',
      href: '/personal',
    },
    {
      title: '방명록',
      href: '/guestbook',
    },
  ]

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState({
    title: 'ARTIST PORTFOLIO',
    description: 'Summer Vibes & Creative Works',
    image: '/placeholder-user.jpg',
    career: '',
    contact: ''
  })
  const [showExtra, setShowExtra] = useState(false)

  useEffect(() => {
    const savedProfile = localStorage.getItem('portfolio-profile')
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile))
    }
    
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true')
    }
    window.addEventListener('storage', checkAdmin)
    checkAdmin()
    return () => window.removeEventListener('storage', checkAdmin)
  }, [])

  const handleUpdateProfile = (field: string, value: string) => {
    const newProfile = { ...profile, [field]: value }
    setProfile(newProfile)
    localStorage.setItem('portfolio-profile', JSON.stringify(newProfile))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload/file', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          handleUpdateProfile('image', data.url)
        }
      } catch (err) {
        console.error('Upload failed', err)
      }
    }
  }

  const completeEdit = () => {
    setIsAdmin(false)
    localStorage.setItem('isAdmin', 'false')
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-transparent scale-90 md:scale-95 lg:scale-100 origin-top">
      {/* 상단 프로필 영역 */}
      <div className="flex flex-col items-center mb-10 mt-6 bg-white/20 p-6 rounded-[30px] backdrop-blur-sm border border-white/30 transition-all hover:bg-white/30">
        <div className="relative group mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg relative">
            <Image 
              src={profile.image} 
              alt="Profile" 
              width={128} 
              height={128}
              className="object-cover"
            />
          </div>
          {isAdmin && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              변경
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
          )}
        </div>
        
        {isAdmin ? (
          <div className="flex flex-col items-center gap-2">
            <input 
              className="text-2xl font-bold text-[#003366] bg-white/50 border-b border-[#003366]/50 text-center focus:outline-none w-64 rounded-sm"
              value={profile.title}
              onChange={(e) => handleUpdateProfile('title', e.target.value)}
              placeholder="작가명"
            />
            <input 
              className="text-[#004488]/80 text-xs bg-white/30 border-b border-[#004488]/30 text-center focus:outline-none w-64 rounded-sm"
              value={profile.description}
              onChange={(e) => handleUpdateProfile('description', e.target.value)}
              placeholder="한줄 소개"
            />
            <textarea 
              className="mt-2 text-[#003366]/70 text-[10px] bg-white/30 border border-[#003366]/20 text-center focus:outline-none w-64 rounded-xl p-2 h-16 resize-none"
              value={profile.career}
              onChange={(e) => handleUpdateProfile('career', e.target.value)}
              placeholder="경력 사항"
            />
            <textarea 
              className="mt-1 text-[#003366]/70 text-[10px] bg-white/30 border border-[#003366]/20 text-center focus:outline-none w-64 rounded-xl p-2 h-16 resize-none"
              value={profile.contact}
              onChange={(e) => handleUpdateProfile('contact', e.target.value)}
              placeholder="연락처"
            />
            <button 
              onClick={completeEdit}
              className="mt-4 px-4 py-1 bg-[#0066CC] text-white text-xs rounded-full border border-white/40 hover:bg-[#0055AA] transition-colors"
            >
              수정 완료
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-[#003366] mb-2 drop-shadow-[1px_1px_0_rgba(255,255,255,0.8)]">
              {profile.title}
            </h1>
            <p className="text-[#004488] text-sm font-medium opacity-90 mb-6">
              {profile.description}
            </p>
            
            <div className="flex flex-col items-center mt-2 group cursor-pointer" onClick={() => setShowExtra(true)}>
              <span className="text-[10px] font-bold text-[#003366]/80 mb-1 group-hover:text-[#0066CC] transition-colors">작가 정보 더보기</span>
              <button 
                className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-[#ffcd00] group-hover:bg-[#0066CC] group-hover:text-white transition-all transform group-hover:rotate-12 shadow-sm border border-white/20"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showExtra} onOpenChange={setShowExtra}>
        <DialogContent className="max-w-xs bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-[#003366] text-center">작가 정보</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-[#0066CC] mb-2 border-b border-[#0066CC]/20 pb-1 uppercase">Career</h4>
              <p className="text-[#003366]/80 text-xs whitespace-pre-wrap leading-relaxed">{profile.career || '등록된 경력이 없습니다.'}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-[#0066CC] mb-2 border-b border-[#0066CC]/20 pb-1 uppercase">Contact</h4>
              <p className="text-[#003366]/80 text-xs whitespace-pre-wrap leading-relaxed">{profile.contact || '등록된 연락처가 없습니다.'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 폴더 아이콘 그리드 */}
      <div className="max-w-4xl w-full grid grid-cols-2 md:grid-cols-4 gap-12 px-4 mt-4">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-24 h-24 mb-3 relative flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
              <Image 
                src="/B.webp" 
                alt={category.title}
                width={96} 
                height={96}
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-[#003366] text-[13px] font-bold tracking-tighter transition-all group-hover:text-[#0066CC] border-b border-[#003366]/20 py-0.5">
                {category.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
