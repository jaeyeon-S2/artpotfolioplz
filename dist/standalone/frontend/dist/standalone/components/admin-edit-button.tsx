'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AdminPasswordDialog } from '@/components/admin-password-dialog'

export function AdminEditButton() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const handleEditClick = () => {
    if (isAdmin) {
      setIsAdmin(false)
    } else {
      setShowPasswordDialog(true)
    }
  }

  const onSuccess = () => {
    setIsAdmin(true)
    setShowPasswordDialog(false)
    localStorage.setItem('isAdmin', 'true')
    window.dispatchEvent(new Event('storage'))
    alert('관리자 모드가 활성화되었습니다. 메인 화면에서 텍스트와 프사 URL을 직접 수정할 수 있습니다.')
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 rounded-lg p-1 bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/30 transition-all active:scale-95"
        onClick={handleEditClick}
      >
        <Image 
          src="/C.webp" 
          alt="Edit" 
          width={32} 
          height={32} 
          className={`w-full h-full object-contain ${isAdmin ? 'animate-bounce' : ''}`}
        />
      </Button>

      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={onSuccess}
      />
    </>
  )
}
