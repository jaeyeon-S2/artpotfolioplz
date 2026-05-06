import { notFound } from 'next/navigation'
import { getWebtoonProjectById } from '@/lib/local-db'
import { WebtoonPlanner } from '../webtoon-planner'

export const dynamic = 'force-dynamic'

export default async function WebtoonProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getWebtoonProjectById(projectId)

  if (!project) {
    notFound()
  }

  return <WebtoonPlanner projectId={project.id} initialProject={project} />
}
