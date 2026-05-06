'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Edit, Upload, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AdminPasswordDialog } from '@/components/admin-password-dialog'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  profile_image: string | null
  one_line_intro: string | null
  career: string | null
  contact: string | null
  created_at: string
  updated_at: string
}

export function ProfileEditor({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [oneLineIntro, setOneLineIntro] = useState(profile?.one_line_intro || '')
  const [career, setCareer] = useState(profile?.career || '')
  const [contact, setContact] = useState(profile?.contact || '')
  const [profileImage, setProfileImage] = useState(profile?.profile_image || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleEditClick = () => {
    setShowPasswordDialog(true)
  }

  const handlePasswordSuccess = () => {
    setIsEditing(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setProfileImage(url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          one_line_intro: oneLineIntro,
          career,
          contact,
          profile_image: profileImage,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setOneLineIntro(profile?.one_line_intro || '')
    setCareer(profile?.career || '')
    setContact(profile?.contact || '')
    setProfileImage(profile?.profile_image || '')
    setIsEditing(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>프로필</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-40 h-40 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-4xl">?</span>
                </div>
              )}
            </div>
            {isEditing && (
              <div>
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isUploading}
                >
                  <label htmlFor="profile-image" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? '업로드 중...' : '이미지 업로드'}
                  </label>
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border bg-background p-4 flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">한줄소개</p>
                  <Input
                    value={oneLineIntro}
                    onChange={(e) => setOneLineIntro(e.target.value)}
                    placeholder="한줄 소개를 입력하세요"
                  />
                </div>

                <div className="rounded-lg border bg-background p-4 flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">경력</p>
                  <Textarea
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    placeholder="경력을 입력하세요"
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div className="rounded-lg border bg-background p-4 flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">연락처</p>
                  <Textarea
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="연락처를 입력하세요"
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="rounded-lg border bg-muted/50 p-4 min-h-[90px]">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">한줄소개</p>
                  <p className="text-foreground whitespace-pre-wrap">
                    {profile?.one_line_intro || '아직 한줄소개가 작성되지 않았습니다.'}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 min-h-[120px]">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">경력</p>
                  <p className="text-foreground whitespace-pre-wrap">
                    {profile?.career || '아직 경력이 작성되지 않았습니다.'}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 min-h-[100px]">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">연락처</p>
                  <p className="text-foreground whitespace-pre-wrap">
                    {profile?.contact || '아직 연락처가 작성되지 않았습니다.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handlePasswordSuccess}
        title="프로필 수정"
        description="프로필을 수정하려면 관리자 비밀번호를 입력하세요."
      />
    </>
  )
}
