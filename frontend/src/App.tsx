import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import PortfolioLayout from '../app/(portfolio)/layout'
import HomePage from '../app/(portfolio)/page'
import WorksPage from '../app/(portfolio)/works/page'
import PersonalPage from '../app/(portfolio)/personal/page'
import GuestbookPage from '../app/(portfolio)/guestbook/page'
import ProfilePage from '../app/(portfolio)/profile/page'
import WebtoonPage from '../app/(portfolio)/webtoon/page'
import WebtoonProjectPage from '../app/(portfolio)/webtoon/[projectId]/page'
import WebtoonEpisodePreviewPage from '../app/(portfolio)/webtoon/[projectId]/episodes/[episodeId]/preview/page'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div className="max-w-md rounded-3xl border border-white/30 bg-white/20 p-8 backdrop-blur-xl shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[#003366]/60">Not Found</p>
        <h1 className="mt-3 text-2xl font-bold text-[#003366]">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm text-[#003366]/80">요청한 경로를 확인한 뒤 다시 시도해 주세요.</p>
      </div>
    </div>
  )
}

function parseRoute(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/'

  if (normalized === '/') {
    return { kind: 'home' as const }
  }

  if (normalized === '/works') {
    return { kind: 'works' as const }
  }

  if (normalized === '/personal') {
    return { kind: 'personal' as const }
  }

  if (normalized === '/guestbook') {
    return { kind: 'guestbook' as const }
  }

  if (normalized === '/profile') {
    return { kind: 'profile' as const }
  }

  if (normalized === '/webtoon') {
    return { kind: 'webtoon' as const }
  }

  const previewMatch = normalized.match(
    /^\/webtoon\/([^/]+)\/episodes\/([^/]+)\/preview$/,
  )
  if (previewMatch) {
    return {
      kind: 'webtoon-preview' as const,
      projectId: decodeURIComponent(previewMatch[1]),
      episodeId: decodeURIComponent(previewMatch[2]),
    }
  }

  const webtoonProjectMatch = normalized.match(/^\/webtoon\/([^/]+)$/)
  if (webtoonProjectMatch) {
    return {
      kind: 'webtoon-project' as const,
      projectId: decodeURIComponent(webtoonProjectMatch[1]),
    }
  }

  return { kind: 'not-found' as const }
}

export default function App() {
  const pathname = usePathname()
  const route = useMemo(() => parseRoute(pathname), [pathname])

  if (route.kind === 'webtoon-preview') {
    return <WebtoonEpisodePreviewPage />
  }

  const page = (() => {
    switch (route.kind) {
      case 'home':
        return <HomePage />
      case 'works':
        return <WorksPage />
      case 'personal':
        return <PersonalPage />
      case 'guestbook':
        return <GuestbookPage />
      case 'profile':
        return <ProfilePage />
      case 'webtoon':
        return <WebtoonPage />
      case 'webtoon-project':
        return <WebtoonProjectPage />
      case 'not-found':
      default:
        return <NotFoundPage />
    }
  })()

  return <PortfolioLayout>{page}</PortfolioLayout>
}
