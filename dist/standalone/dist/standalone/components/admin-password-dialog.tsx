'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ADMIN_PASSWORD = '1234'

interface AdminPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  title?: string
  description?: string
}

export function AdminPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
  title = '관리자 인증',
  description = '관리자 비밀번호를 입력하세요.',
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setPassword('')
      setError(false)
      onOpenChange(false)
      onSuccess()
    } else {
      setError(true)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword('')
      setError(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                placeholder="관리자 비밀번호 입력"
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">
                  비밀번호가 올바르지 않습니다.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">확인</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
