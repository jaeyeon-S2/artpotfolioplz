import { useSyncExternalStore } from 'react'

type Router = {
  push: (href: string) => void
  replace: (href: string) => void
  back: () => void
  forward: () => void
  refresh: () => void
}

function getSnapshot() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return `${window.location.pathname}${window.location.search}`
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener('popstate', callback)
  window.addEventListener('hashchange', callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener('hashchange', callback)
  }
}

function navigate(href: string, replace = false) {
  if (typeof window === 'undefined') {
    return
  }

  if (replace) {
    window.history.replaceState({}, '', href)
  } else {
    window.history.pushState({}, '', href)
  }

  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePathname() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '/')
  return snapshot.split('?')[0] || '/'
}

export function useRouter(): Router {
  return {
    push: (href) => navigate(href),
    replace: (href) => navigate(href, true),
    back: () => {
      if (typeof window !== 'undefined') {
        window.history.back()
      }
    },
    forward: () => {
      if (typeof window !== 'undefined') {
        window.history.forward()
      }
    },
    refresh: () => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    },
  }
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  const pathname = usePathname()
  const previewMatch = pathname.match(/^\/webtoon\/([^/]+)\/episodes\/([^/]+)\/preview$/)
  if (previewMatch) {
    return {
      projectId: decodeURIComponent(previewMatch[1]),
      episodeId: decodeURIComponent(previewMatch[2]),
    } as T
  }

  const projectMatch = pathname.match(/^\/webtoon\/([^/]+)$/)
  if (projectMatch) {
    return {
      projectId: decodeURIComponent(projectMatch[1]),
    } as T
  }

  return {} as T
}

export function notFound(): never {
  if (typeof window !== 'undefined') {
    window.location.replace('/')
  }

  throw new Error('Route not found')
}
