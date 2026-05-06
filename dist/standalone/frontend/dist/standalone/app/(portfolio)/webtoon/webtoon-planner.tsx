'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, ExternalLink, Plus, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface WebtoonSection {
  content: string | null
  attachments: string[]
}

interface WebtoonEpisode {
  id: string
  episode_number: number
  title: string | null
  thumbnail_url: string | null
  reading_mode: 'scroll' | 'page'
  manuscript_pages: string[]
  manuscript_url: string | null
  created_at: string
}

type EpisodeReadingMode = 'scroll' | 'page'

interface WebtoonProject {
  id: string
  cover_image: string | null
  title: string | null
  logline: string | null
  description: string | null
  planning: WebtoonSection
  character_sheet: WebtoonSection
  story: WebtoonSection
  episodes: WebtoonEpisode[]
  created_at: string
  updated_at: string
}

interface WebtoonPlannerProps {
  projectId: string
  initialProject: WebtoonProject
}

const SECTION_LABEL: Record<'planning' | 'character_sheet' | 'story', string> = {
  planning: '기획서',
  character_sheet: '캐릭터시트',
  story: '스토리',
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getFileLabel(url: string, index: number, fallbackPrefix = '파일'): string {
  const fileName = url.split('/').pop()
  if (!fileName) {
    return `${fallbackPrefix} ${index + 1}`
  }

  const decoded = decodeURIComponent(fileName)
  const cleaned = decoded.replace(/^\d+-/, '')
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix} ${index + 1}`
}

function getEpisodeManuscriptPages(episode: WebtoonEpisode): string[] {
  const filteredPages = Array.isArray(episode.manuscript_pages)
    ? episode.manuscript_pages.filter(
        (item): item is string =>
          typeof item === 'string' &&
          item.length > 0 &&
          item !== episode.thumbnail_url,
      )
    : []

  if (filteredPages.length > 0) {
    return filteredPages
  }

  if (episode.manuscript_url && episode.manuscript_url !== episode.thumbnail_url) {
    return [episode.manuscript_url]
  }

  return []
}

export function WebtoonPlanner({ projectId, initialProject }: WebtoonPlannerProps) {
  const [project, setProject] = useState(initialProject)

  const [coverImage, setCoverImage] = useState(initialProject.cover_image || '')
  const [title, setTitle] = useState(initialProject.title || '')
  const [logline, setLogline] = useState(initialProject.logline || '')
  const [description, setDescription] = useState(initialProject.description || '')

  const [planningAttachments, setPlanningAttachments] = useState(
    initialProject.planning.attachments || [],
  )

  const [characterContent, setCharacterContent] = useState(
    initialProject.character_sheet.content || '',
  )
  const [characterAttachments, setCharacterAttachments] = useState(
    initialProject.character_sheet.attachments || [],
  )

  const [storyContent, setStoryContent] = useState(initialProject.story.content || '')
  const [storyAttachments, setStoryAttachments] = useState(
    initialProject.story.attachments || [],
  )

  const [episodeNumber, setEpisodeNumber] = useState('')
  const [episodeTitle, setEpisodeTitle] = useState('')
  const [episodeReadingMode, setEpisodeReadingMode] =
    useState<EpisodeReadingMode>('scroll')
  const [episodeThumbnailUrl, setEpisodeThumbnailUrl] = useState('')
  const [episodeManuscriptUrls, setEpisodeManuscriptUrls] = useState<string[]>([])

  const [isEditMode, setIsEditMode] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSavingMeta, setIsSavingMeta] = useState(false)
  const [savingSection, setSavingSection] = useState<
    'planning' | 'character_sheet' | 'story' | null
  >(null)
  const [isRegisteringEpisode, setIsRegisteringEpisode] = useState(false)
  const [episodeError, setEpisodeError] = useState('')
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [editingEpisodeTitle, setEditingEpisodeTitle] = useState('')
  const [editingEpisodeReadingMode, setEditingEpisodeReadingMode] =
    useState<EpisodeReadingMode>('scroll')
  const [editingEpisodeThumbnailUrl, setEditingEpisodeThumbnailUrl] = useState('')
  const [editingEpisodeManuscriptUrls, setEditingEpisodeManuscriptUrls] = useState<
    string[]
  >([])
  const [isSavingEpisodeEdit, setIsSavingEpisodeEdit] = useState(false)
  const [isDeletingEpisode, setIsDeletingEpisode] = useState(false)
  const [episodeManageError, setEpisodeManageError] = useState('')

  const sortedEpisodes = useMemo(
    () => [...project.episodes].sort((a, b) => a.episode_number - b.episode_number),
    [project.episodes],
  )

  const selectedEpisode = useMemo(
    () => sortedEpisodes.find((episode) => episode.id === selectedEpisodeId) || null,
    [selectedEpisodeId, sortedEpisodes],
  )

  const selectedEpisodePages = useMemo(
    () => (selectedEpisode ? getEpisodeManuscriptPages(selectedEpisode) : []),
    [selectedEpisode],
  )

  useEffect(() => {
    if (!selectedEpisode) {
      setEditingEpisodeTitle('')
      setEditingEpisodeReadingMode('scroll')
      setEditingEpisodeThumbnailUrl('')
      setEditingEpisodeManuscriptUrls([])
      setEpisodeManageError('')
      return
    }

    setEditingEpisodeTitle(selectedEpisode.title || '')
    setEditingEpisodeReadingMode(selectedEpisode.reading_mode || 'scroll')
    setEditingEpisodeThumbnailUrl(selectedEpisode.thumbnail_url || '')
    setEditingEpisodeManuscriptUrls(getEpisodeManuscriptPages(selectedEpisode))
    setEpisodeManageError('')
  }, [selectedEpisode])

  const syncLocalStateFromProject = (nextProject: WebtoonProject) => {
    setProject(nextProject)
    setCoverImage(nextProject.cover_image || '')
    setTitle(nextProject.title || '')
    setLogline(nextProject.logline || '')
    setDescription(nextProject.description || '')

    const nextSelectedEpisodeId = nextProject.episodes.some(
      (episode) => episode.id === selectedEpisodeId,
    )
      ? selectedEpisodeId
      : null
    setSelectedEpisodeId(nextSelectedEpisodeId)

    setPlanningAttachments(nextProject.planning.attachments || [])

    setCharacterContent(nextProject.character_sheet.content || '')
    setCharacterAttachments(nextProject.character_sheet.attachments || [])

    setStoryContent(nextProject.story.content || '')
    setStoryAttachments(nextProject.story.attachments || [])
  }

  const getEpisodePreviewPath = (episodeId: string): string =>
    `/webtoon/${projectId}/episodes/${episodeId}/preview`

  const uploadFile = async (
    file: File,
    endpoint = '/api/upload',
  ): Promise<string | null> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        return null
      }

      const payload = await response.json()
      return typeof payload.url === 'string' ? payload.url : null
    } catch (error) {
      console.error('Upload failed:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setCoverImage(url)
    }
  }

  const handleSectionAttachmentsUpload = async (
    section: 'planning' | 'character_sheet' | 'story',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      const uploadedUrl = await uploadFile(file)
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl)
      }
    }

    if (uploadedUrls.length === 0) return

    if (section === 'planning') {
      setPlanningAttachments((prev) => [...prev, ...uploadedUrls])
    }

    if (section === 'character_sheet') {
      setCharacterAttachments((prev) => [...prev, ...uploadedUrls])
    }

    if (section === 'story') {
      setStoryAttachments((prev) => [...prev, ...uploadedUrls])
    }

    e.target.value = ''
  }

  const handlePlanningFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      const uploadedUrl = await uploadFile(file, '/api/upload/file')
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl)
      }
    }

    if (uploadedUrls.length > 0) {
      setPlanningAttachments((prev) => [...prev, ...uploadedUrls])
    }

    e.target.value = ''
  }

  const removeSectionAttachment = (
    section: 'planning' | 'character_sheet' | 'story',
    indexToRemove: number,
  ) => {
    if (section === 'planning') {
      setPlanningAttachments((prev) => prev.filter((_, index) => index !== indexToRemove))
    }

    if (section === 'character_sheet') {
      setCharacterAttachments((prev) =>
        prev.filter((_, index) => index !== indexToRemove),
      )
    }

    if (section === 'story') {
      setStoryAttachments((prev) => prev.filter((_, index) => index !== indexToRemove))
    }
  }

  const handleMetaSave = async () => {
    setIsSavingMeta(true)

    try {
      const response = await fetch(`/api/webtoon/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meta',
          cover_image: toNullableText(coverImage),
          title: toNullableText(title),
          logline: toNullableText(logline),
          description: toNullableText(description),
        }),
      })

      if (!response.ok) return

      const payload = await response.json()
      if (payload?.project) {
        syncLocalStateFromProject(payload.project)
      }
    } catch (error) {
      console.error('Save meta failed:', error)
    } finally {
      setIsSavingMeta(false)
    }
  }

  const handleSectionSave = async (section: 'planning' | 'character_sheet' | 'story') => {
    const attachmentsBySection = {
      planning: planningAttachments,
      character_sheet: characterAttachments,
      story: storyAttachments,
    }

    setSavingSection(section)

    try {
      const response = await fetch(`/api/webtoon/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'section',
          section,
          content:
            section === 'planning'
              ? null
              : toNullableText(
                  section === 'character_sheet' ? characterContent : storyContent,
                ),
          attachments: attachmentsBySection[section],
        }),
      })

      if (!response.ok) return

      const payload = await response.json()
      if (payload?.project) {
        syncLocalStateFromProject(payload.project)
      }
    } catch (error) {
      console.error('Save section failed:', error)
    } finally {
      setSavingSection(null)
    }
  }

  const handleEpisodeThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setEpisodeThumbnailUrl(url)
    }

    e.target.value = ''
  }

  const handleEpisodeManuscriptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      const uploadedUrl = await uploadFile(file)
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl)
      }
    }

    if (uploadedUrls.length > 0) {
      setEpisodeManuscriptUrls((prev) => [...prev, ...uploadedUrls])
    }

    e.target.value = ''
  }

  const removeEpisodeManuscript = (indexToRemove: number) => {
    setEpisodeManuscriptUrls((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    )
  }

  const handleEditingEpisodeThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadedUrl = await uploadFile(file)
    if (uploadedUrl) {
      setEditingEpisodeThumbnailUrl(uploadedUrl)
    }

    e.target.value = ''
  }

  const handleEditingEpisodeManuscriptUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      const uploadedUrl = await uploadFile(file)
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl)
      }
    }

    if (uploadedUrls.length > 0) {
      setEditingEpisodeManuscriptUrls((prev) => [...prev, ...uploadedUrls])
    }

    e.target.value = ''
  }

  const removeEditingEpisodeManuscript = (indexToRemove: number) => {
    setEditingEpisodeManuscriptUrls((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    )
  }

  const handleEpisodeUpdate = async () => {
    if (!selectedEpisode) {
      return
    }

    if (editingEpisodeManuscriptUrls.length === 0) {
      setEpisodeManageError('원고 이미지를 1장 이상 유지해 주세요.')
      return
    }

    setEpisodeManageError('')
    setIsSavingEpisodeEdit(true)

    try {
      const response = await fetch(`/api/webtoon/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'episode',
          episode_id: selectedEpisode.id,
          title: toNullableText(editingEpisodeTitle),
          thumbnail_url: toNullableText(editingEpisodeThumbnailUrl),
          reading_mode: editingEpisodeReadingMode,
          manuscript_pages: editingEpisodeManuscriptUrls,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        setEpisodeManageError(
          errorPayload?.error || '원고 수정에 실패했습니다. 다시 시도해 주세요.',
        )
        return
      }

      const payload = await response.json()
      if (payload?.project) {
        syncLocalStateFromProject(payload.project)
      }
    } catch (error) {
      console.error('Update episode failed:', error)
      setEpisodeManageError('원고 수정에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsSavingEpisodeEdit(false)
    }
  }

  const handleEpisodeDelete = async () => {
    if (!selectedEpisode) {
      return
    }

    const shouldDelete = window.confirm(
      `${selectedEpisode.episode_number}화를 삭제하시겠어요? 삭제 후 복구할 수 없습니다.`,
    )

    if (!shouldDelete) {
      return
    }

    setEpisodeManageError('')
    setIsDeletingEpisode(true)

    try {
      const response = await fetch(
        `/api/webtoon/${projectId}?episodeId=${selectedEpisode.id}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        setEpisodeManageError(
          errorPayload?.error || '회차 삭제에 실패했습니다. 다시 시도해 주세요.',
        )
        return
      }

      const payload = await response.json()
      if (payload?.project) {
        syncLocalStateFromProject(payload.project)
      }
    } catch (error) {
      console.error('Delete episode failed:', error)
      setEpisodeManageError('회차 삭제에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsDeletingEpisode(false)
    }
  }

  const handleEpisodeRegister = async () => {
    const numericEpisode = Number(episodeNumber)
    if (!Number.isInteger(numericEpisode) || numericEpisode < 1) {
      setEpisodeError('화수는 1 이상의 정수로 입력해 주세요.')
      return
    }

    if (episodeManuscriptUrls.length === 0) {
      setEpisodeError('원고 이미지를 1장 이상 업로드해 주세요.')
      return
    }

    setEpisodeError('')
    setIsRegisteringEpisode(true)

    try {
      const response = await fetch(`/api/webtoon/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode_number: numericEpisode,
          title: toNullableText(episodeTitle),
          thumbnail_url: toNullableText(episodeThumbnailUrl),
          reading_mode: episodeReadingMode,
          manuscript_pages: episodeManuscriptUrls,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        setEpisodeError(
          errorPayload?.error || '원고 등록에 실패했습니다. 다시 시도해 주세요.',
        )
        return
      }

      const createdEpisode = (await response.json()) as WebtoonEpisode

      setProject((prev) => ({
        ...prev,
        episodes: [...prev.episodes, createdEpisode].sort(
          (a, b) => a.episode_number - b.episode_number,
        ),
      }))

      setEpisodeNumber('')
      setEpisodeTitle('')
      setEpisodeReadingMode('scroll')
      setEpisodeThumbnailUrl('')
      setEpisodeManuscriptUrls([])
      setEpisodeError('')
    } catch (error) {
      console.error('Register episode failed:', error)
      setEpisodeError('원고 등록에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsRegisteringEpisode(false)
    }
  }

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-foreground">웹툰 기획</h1>
          <Button
            type="button"
            variant={isEditMode ? 'secondary' : 'default'}
            onClick={() => setIsEditMode((prev) => !prev)}
          >
            {isEditMode ? '소개 보기' : '수정 모드'}
          </Button>
        </div>

        {isEditMode ? (
          <>
            <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border bg-muted">
          {coverImage ? (
            <Image src={coverImage} alt="웹툰 표지" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              아직 등록된 표지가 없습니다.
            </div>
          )}
            </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>기본 정보</CardTitle>
            <Button onClick={handleMetaSave} disabled={isSavingMeta || isUploading}>
              {isSavingMeta ? '저장 중...' : '기본 정보 저장'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>표지 등록</Label>
              <input
                id="webtoon-cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={isUploading}
                className="w-fit"
              >
                <label htmlFor="webtoon-cover-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? '업로드 중...' : '표지 업로드'}
                </label>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="webtoon-title">제목</Label>
                <Input
                  id="webtoon-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="작품 제목을 입력하세요"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="webtoon-logline">로그라인</Label>
                <Input
                  id="webtoon-logline"
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  placeholder="작품의 핵심 문장을 입력하세요"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="webtoon-description">작품설명</Label>
              <Textarea
                id="webtoon-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="작품 설명을 입력하세요"
                className="min-h-[140px] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>기획 자료</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="planning" className="gap-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1">
                <TabsTrigger value="planning">기획서</TabsTrigger>
                <TabsTrigger value="character_sheet">캐릭터시트</TabsTrigger>
                <TabsTrigger value="story">스토리</TabsTrigger>
                <TabsTrigger value="episodes">원고</TabsTrigger>
              </TabsList>

              <TabsContent value="planning" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>기획서 파일</Label>
                  <input
                    id="planning-upload"
                    type="file"
                    accept=".pdf,.hwp,.hwpx,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={handlePlanningFileUpload}
                  />
                  <Button type="button" variant="outline" asChild disabled={isUploading}>
                    <label htmlFor="planning-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? '업로드 중...' : '파일 업로드'}
                    </label>
                  </Button>

                  {planningAttachments.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {planningAttachments.map((url, index) => (
                        <li
                          key={`${url}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3"
                        >
                          <a
                            href={url}
                            download
                            className="inline-flex min-w-0 flex-1 items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Download className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {getFileLabel(url, index, '기획서 파일')}
                            </span>
                          </a>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeSectionAttachment('planning', index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  onClick={() => handleSectionSave('planning')}
                  disabled={savingSection === 'planning' || isUploading}
                >
                  {savingSection === 'planning'
                    ? '저장 중...'
                    : `${SECTION_LABEL.planning} 저장`}
                </Button>
              </TabsContent>

              <TabsContent value="character_sheet" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>캐릭터시트 내용</Label>
                  <Textarea
                    value={characterContent}
                    onChange={(e) => setCharacterContent(e.target.value)}
                    placeholder="캐릭터시트 내용을 입력하세요"
                    className="min-h-[180px] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>첨부 이미지</Label>
                  <input
                    id="character-sheet-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleSectionAttachmentsUpload('character_sheet', e)}
                  />
                  <Button type="button" variant="outline" asChild disabled={isUploading}>
                    <label htmlFor="character-sheet-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? '업로드 중...' : '이미지 추가'}
                    </label>
                  </Button>

                  {characterAttachments.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {characterAttachments.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative rounded-lg overflow-hidden border bg-muted aspect-square"
                        >
                          <Image
                            src={url}
                            alt={`캐릭터시트 첨부 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 w-7 h-7"
                            onClick={() => removeSectionAttachment('character_sheet', index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSectionSave('character_sheet')}
                  disabled={savingSection === 'character_sheet' || isUploading}
                >
                  {savingSection === 'character_sheet'
                    ? '저장 중...'
                    : `${SECTION_LABEL.character_sheet} 저장`}
                </Button>
              </TabsContent>

              <TabsContent value="story" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>스토리 내용</Label>
                  <Textarea
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                    placeholder="스토리 내용을 입력하세요"
                    className="min-h-[180px] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>첨부 이미지</Label>
                  <input
                    id="story-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleSectionAttachmentsUpload('story', e)}
                  />
                  <Button type="button" variant="outline" asChild disabled={isUploading}>
                    <label htmlFor="story-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? '업로드 중...' : '이미지 추가'}
                    </label>
                  </Button>

                  {storyAttachments.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {storyAttachments.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative rounded-lg overflow-hidden border bg-muted aspect-square"
                        >
                          <Image
                            src={url}
                            alt={`스토리 첨부 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 w-7 h-7"
                            onClick={() => removeSectionAttachment('story', index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSectionSave('story')}
                  disabled={savingSection === 'story' || isUploading}
                >
                  {savingSection === 'story' ? '저장 중...' : `${SECTION_LABEL.story} 저장`}
                </Button>
              </TabsContent>

              <TabsContent value="episodes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">원고 등록</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="episode-number">화수</Label>
                        <Input
                          id="episode-number"
                          type="number"
                          min={1}
                          value={episodeNumber}
                          onChange={(e) => setEpisodeNumber(e.target.value)}
                          placeholder="예: 1"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="episode-title">제목 (선택)</Label>
                        <Input
                          id="episode-title"
                          value={episodeTitle}
                          onChange={(e) => setEpisodeTitle(e.target.value)}
                          placeholder="예: 1화 - 첫 만남"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>원고 형식</Label>
                      <div className="inline-flex w-fit items-center gap-1 rounded-lg border bg-muted/30 p-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={episodeReadingMode === 'scroll' ? 'default' : 'ghost'}
                          onClick={() => setEpisodeReadingMode('scroll')}
                        >
                          스크롤 웹툰
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={episodeReadingMode === 'page' ? 'default' : 'ghost'}
                          onClick={() => setEpisodeReadingMode('page')}
                        >
                          페이지 만화
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        스크롤 웹툰: 이어보기 · 페이지 만화: 슬라이드/확대 보기
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>썸네일 등록</Label>
                        <input
                          id="episode-thumb-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleEpisodeThumbnailUpload}
                        />
                        <Button type="button" variant="outline" asChild disabled={isUploading}>
                          <label htmlFor="episode-thumb-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? '업로드 중...' : '썸네일 업로드'}
                          </label>
                        </Button>
                        {episodeThumbnailUrl && (
                          <div className="relative w-20 h-28 rounded-md overflow-hidden border bg-muted">
                            <Image src={episodeThumbnailUrl} alt="썸네일" fill className="object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <Label>원고 등록</Label>
                        <input
                          id="episode-manuscript-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleEpisodeManuscriptUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          asChild
                          disabled={isUploading}
                        >
                          <label htmlFor="episode-manuscript-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? '업로드 중...' : '원고 업로드 (복수 선택)'}
                          </label>
                        </Button>

                        {episodeManuscriptUrls.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            업로드한 원고 파일이 없습니다.
                          </p>
                        ) : (
                          <ol className="space-y-2 rounded-lg border bg-muted/30 p-3">
                            {episodeManuscriptUrls.map((url, index) => (
                              <li
                                key={`${url}-${index}`}
                                className="flex items-center gap-2 rounded-md bg-background px-2 py-1.5"
                              >
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                  {index + 1}
                                </span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
                                >
                                  {getFileLabel(url, index, '원고 페이지')}
                                </a>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeEpisodeManuscript(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>

                    {episodeError && (
                      <p className="text-sm text-destructive">{episodeError}</p>
                    )}

                    <Button onClick={handleEpisodeRegister} disabled={isRegisteringEpisode || isUploading}>
                      <Plus className="w-4 h-4 mr-2" />
                      {isRegisteringEpisode ? '등록 중...' : '원고 등록'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">화별 원고 목록</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sortedEpisodes.length === 0 ? (
                      <p className="text-muted-foreground">아직 등록된 원고가 없습니다.</p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {sortedEpisodes.map((episode) => {
                          const manuscriptPages = getEpisodeManuscriptPages(episode)
                          const isSelected = selectedEpisode?.id === episode.id

                          return (
                            <li key={episode.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedEpisodeId(episode.id)}
                                className={`w-full flex items-center gap-4 rounded-lg border bg-background p-3 text-left transition-colors ${
                                  isSelected
                                    ? 'border-primary/60 bg-primary/5'
                                    : 'hover:border-primary/40'
                                }`}
                              >
                                <div className="relative w-14 h-20 rounded-md overflow-hidden bg-muted border shrink-0">
                                  {episode.thumbnail_url ? (
                                    <Image
                                      src={episode.thumbnail_url}
                                      alt={`${episode.episode_number}화 썸네일`}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[11px] text-muted-foreground">
                                      No Image
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground">
                                    {episode.episode_number}화
                                    {episode.title ? ` - ${episode.title}` : ''}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    원고 {manuscriptPages.length}장 · 형식{' '}
                                    {episode.reading_mode === 'page'
                                      ? '페이지 만화'
                                      : '스크롤 웹툰'}{' '}
                                    · 등록일{' '}
                                    {new Date(episode.created_at).toLocaleDateString('ko-KR')}
                                  </p>
                                </div>

                                <span className="text-sm text-primary inline-flex items-center gap-1">
                                  원고 보기
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {selectedEpisode ? (
                  <Card>
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <CardTitle className="text-lg">
                        {selectedEpisode.episode_number}화 원고 관리
                      </CardTitle>

                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" asChild>
                          <a
                            href={getEpisodePreviewPath(selectedEpisode.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            미리보기
                          </a>
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleEpisodeDelete}
                          disabled={isDeletingEpisode || isSavingEpisodeEdit}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeletingEpisode ? '삭제 중...' : '회차 삭제'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="editing-episode-title">제목</Label>
                          <Input
                            id="editing-episode-title"
                            value={editingEpisodeTitle}
                            onChange={(e) => setEditingEpisodeTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label>썸네일</Label>
                          <input
                            id="editing-episode-thumbnail-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEditingEpisodeThumbnailUpload}
                          />
                          <Button type="button" variant="outline" asChild disabled={isUploading}>
                            <label htmlFor="editing-episode-thumbnail-upload" className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              {isUploading ? '업로드 중...' : '썸네일 변경'}
                            </label>
                          </Button>

                          {editingEpisodeThumbnailUrl ? (
                            <div className="flex items-center gap-3">
                              <div className="relative h-20 w-14 overflow-hidden rounded border bg-muted">
                                <Image
                                  src={editingEpisodeThumbnailUrl}
                                  alt="수정 중 썸네일"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setEditingEpisodeThumbnailUrl('')}
                              >
                                썸네일 제거
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              등록된 썸네일이 없습니다.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>원고 형식</Label>
                        <div className="inline-flex w-fit items-center gap-1 rounded-lg border bg-muted/30 p-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              editingEpisodeReadingMode === 'scroll'
                                ? 'default'
                                : 'ghost'
                            }
                            onClick={() => setEditingEpisodeReadingMode('scroll')}
                          >
                            스크롤 웹툰
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              editingEpisodeReadingMode === 'page'
                                ? 'default'
                                : 'ghost'
                            }
                            onClick={() => setEditingEpisodeReadingMode('page')}
                          >
                            페이지 만화
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>원고 파일 목록</Label>
                        <input
                          id="editing-episode-manuscript-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleEditingEpisodeManuscriptUpload}
                        />
                        <Button type="button" variant="outline" asChild disabled={isUploading} className="w-fit">
                          <label htmlFor="editing-episode-manuscript-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? '업로드 중...' : '원고 파일 추가'}
                          </label>
                        </Button>

                        {editingEpisodeManuscriptUrls.length === 0 ? (
                          <p className="text-sm text-muted-foreground">등록된 원고가 없습니다.</p>
                        ) : (
                          <ol className="space-y-1 rounded-lg border bg-muted/30 p-2">
                            {editingEpisodeManuscriptUrls.map((url, index) => (
                              <li
                                key={`${url}-${index}`}
                                className="flex items-center gap-2 rounded-md bg-background px-2 py-1"
                              >
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                  {index + 1}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                  {getFileLabel(url, index, '원고 페이지')}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeEditingEpisodeManuscript(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>

                      {episodeManageError && (
                        <p className="text-sm text-destructive">{episodeManageError}</p>
                      )}

                      <Button
                        type="button"
                        onClick={handleEpisodeUpdate}
                        disabled={isSavingEpisodeEdit || isDeletingEpisode || isUploading}
                      >
                        {isSavingEpisodeEdit ? '저장 중...' : '원고 수정 저장'}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-4">
                      <p className="text-sm text-muted-foreground">
                        화별 원고 목록에서 회차를 선택하면 원고 관리가 표시됩니다.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </>
        ) : (
          <>
            <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border bg-muted">
              {project.cover_image ? (
                <Image src={project.cover_image} alt="웹툰 표지" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  아직 등록된 표지가 없습니다.
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-xs tracking-[0.2em] text-muted-foreground">WEBTOON PROJECT</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  {project.title || '제목 없는 기획'}
                </h2>
                <p className="mt-3 text-lg md:text-xl leading-relaxed text-muted-foreground">
                  {project.logline || '로그라인이 아직 없습니다.'}
                </p>
                <div className="mt-6 border-t pt-6">
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                    {project.description || '작품 설명이 아직 없습니다.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>기획 자료</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="planning" className="gap-4">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1">
                    <TabsTrigger value="planning">기획서</TabsTrigger>
                    <TabsTrigger value="character_sheet">캐릭터시트</TabsTrigger>
                    <TabsTrigger value="story">스토리</TabsTrigger>
                    <TabsTrigger value="episodes">원고</TabsTrigger>
                  </TabsList>

                  <TabsContent value="planning" className="space-y-4">
                    {project.planning.attachments.length === 0 ? (
                      <p className="text-muted-foreground">업로드된 기획서 파일이 없습니다.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {project.planning.attachments.map((url, index) => (
                          <li
                            key={`${url}-${index}`}
                            className="rounded-lg border bg-muted/40 p-3"
                          >
                            <a
                              href={url}
                              download
                              className="inline-flex min-w-0 items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <Download className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {getFileLabel(url, index, '기획서 파일')}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  <TabsContent value="character_sheet" className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {project.character_sheet.content || '등록된 캐릭터시트 내용이 없습니다.'}
                      </p>
                    </div>

                    {project.character_sheet.attachments.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {project.character_sheet.attachments.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="relative rounded-lg overflow-hidden border bg-muted aspect-square"
                          >
                            <Image
                              src={url}
                              alt={`캐릭터시트 첨부 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="story" className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {project.story.content || '등록된 스토리 내용이 없습니다.'}
                      </p>
                    </div>

                    {project.story.attachments.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {project.story.attachments.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="relative rounded-lg overflow-hidden border bg-muted aspect-square"
                          >
                            <Image
                              src={url}
                              alt={`스토리 첨부 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="episodes" className="space-y-4">
                    {sortedEpisodes.length === 0 ? (
                      <p className="text-muted-foreground">아직 등록된 원고가 없습니다.</p>
                    ) : (
                      <>
                        <ul className="flex flex-col gap-3">
                          {sortedEpisodes.map((episode) => {
                            const manuscriptPages = getEpisodeManuscriptPages(episode)
                            const isSelected = selectedEpisode?.id === episode.id

                            return (
                              <li key={episode.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedEpisodeId(episode.id)}
                                  className={`w-full flex items-center gap-4 rounded-lg border bg-background p-3 text-left transition-colors ${
                                    isSelected
                                      ? 'border-primary/60 bg-primary/5'
                                      : 'hover:border-primary/40'
                                  }`}
                                >
                                  <div className="relative w-14 h-20 rounded-md overflow-hidden bg-muted border shrink-0">
                                    {episode.thumbnail_url ? (
                                      <Image
                                        src={episode.thumbnail_url}
                                        alt={`${episode.episode_number}화 썸네일`}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[11px] text-muted-foreground">
                                        No Image
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground">
                                      {episode.episode_number}화
                                      {episode.title ? ` - ${episode.title}` : ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      원고 {manuscriptPages.length}장 · 형식{' '}
                                      {episode.reading_mode === 'page'
                                        ? '페이지 만화'
                                        : '스크롤 웹툰'}{' '}
                                      · 등록일{' '}
                                      {new Date(episode.created_at).toLocaleDateString('ko-KR')}
                                    </p>
                                  </div>

                                  <span className="text-sm text-primary inline-flex items-center gap-1">
                                    원고 보기
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>

                        {selectedEpisode ? (
                          <div className="space-y-4 rounded-lg border bg-muted/20 p-3 md:p-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <h3 className="text-base font-semibold text-foreground">
                                {selectedEpisode.episode_number}화
                                {selectedEpisode.title ? ` - ${selectedEpisode.title}` : ''}
                              </h3>

                              <Button type="button" variant="outline" asChild>
                                <a
                                  href={getEpisodePreviewPath(selectedEpisode.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  미리보기
                                </a>
                              </Button>
                            </div>

                            {selectedEpisodePages.length === 0 ? (
                              <p className="text-muted-foreground">등록된 원고가 없습니다.</p>
                            ) : (
                              <div className="rounded-lg border bg-background/70 p-3">
                                <p className="text-sm font-medium text-foreground">
                                  파일 목록 ({selectedEpisodePages.length}장)
                                </p>
                                <ol className="mt-3 space-y-1">
                                  {selectedEpisodePages.map((url, index) => (
                                    <li
                                      key={`${url}-${index}`}
                                      className="flex items-center gap-2 rounded-md bg-background px-2 py-1"
                                    >
                                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                        {index + 1}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                        {getFileLabel(url, index, '원고 페이지')}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-sm text-muted-foreground">
                              회차를 선택하면 파일 목록과 미리보기 버튼이 표시됩니다.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
