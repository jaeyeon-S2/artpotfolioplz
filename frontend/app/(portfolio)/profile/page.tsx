import { useEffect, useState } from 'react'
import { ProfileEditor } from './profile-editor'
import { Chatbot } from '@/components/chatbot'

type Profile = {
  id: string
  profile_image: string | null
  one_line_intro: string | null
  career: string | null
  contact: string | null
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/profile')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setProfile(data)
        }
      })
      .catch((error) => {
        console.error('Failed to load profile:', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!profile) {
    return (
      <div className="min-h-full p-6 md:p-8 lg:p-12 text-[#003366]">
        프로필을 불러오는 중...
      </div>
    )
  }

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">작가 프로필</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfileEditor profile={profile} />
          <Chatbot />
        </div>
      </div>
    </div>
  )
}
