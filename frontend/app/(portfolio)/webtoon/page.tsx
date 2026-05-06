import { getWebtoonProjects } from '@/lib/local-db'
import { WebtoonGallery } from './webtoon-gallery'

export const dynamic = 'force-dynamic'

export default async function WebtoonPage() {
  const projects = await getWebtoonProjects()

  return <WebtoonGallery initialProjects={projects} />
}
