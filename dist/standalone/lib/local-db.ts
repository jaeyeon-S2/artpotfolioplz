import { randomUUID } from 'crypto'
import { access, mkdir, readFile, writeFile } from 'fs/promises'
import { getAppDataDir, getPortfolioDatabasePath } from './runtime-paths'

export type PostCategory = 'webtoon' | 'works' | 'personal'

export interface PostImage {
  id: string
  image_url: string
  sort_order: number
}

export interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
}

export interface Post {
  id: string
  category: PostCategory
  title: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  post_images: PostImage[]
  comments: Comment[]
}

export interface Profile {
  id: string
  profile_image: string | null
  one_line_intro: string | null
  career: string | null
  contact: string | null
  created_at: string
  updated_at: string
}

export interface WebtoonSection {
  content: string | null
  attachments: string[]
}

export type EpisodeReadingMode = 'scroll' | 'page'

export interface WebtoonEpisode {
  id: string
  episode_number: number
  title: string | null
  thumbnail_url: string | null
  reading_mode: EpisodeReadingMode
  manuscript_pages: string[]
  manuscript_url: string | null
  created_at: string
}

export interface WebtoonProject {
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

interface LegacyProfile {
  id?: string
  profile_image?: string | null
  profile_text?: string | null
  one_line_intro?: string | null
  career?: string | null
  contact?: string | null
  created_at?: string
  updated_at?: string
}

interface LegacyWebtoonSection {
  content?: string | null
  attachments?: string[]
}

interface LegacyWebtoonEpisode {
  id?: string
  episode_number?: number
  title?: string | null
  thumbnail_url?: string | null
  reading_mode?: string | null
  manuscript_pages?: string[]
  manuscript_url?: string | null
  created_at?: string
}

interface LegacyWebtoonProject {
  id?: string
  cover_image?: string | null
  title?: string | null
  logline?: string | null
  description?: string | null
  planning?: LegacyWebtoonSection
  character_sheet?: LegacyWebtoonSection
  story?: LegacyWebtoonSection
  episodes?: LegacyWebtoonEpisode[]
  created_at?: string
  updated_at?: string
}

interface LegacyWebtoonPlanner {
  cover_image?: string | null
  title?: string | null
  logline?: string | null
  description?: string | null
  planning?: LegacyWebtoonSection
  character_sheet?: LegacyWebtoonSection
  story?: LegacyWebtoonSection
  episodes?: LegacyWebtoonEpisode[]
  created_at?: string
  updated_at?: string
}

interface PortfolioDatabase {
  profile: Profile
  posts: Post[]
  webtoon_projects: WebtoonProject[]
}

const DEFAULT_PROFILE_ID = '00000000-0000-0000-0000-000000000001'
const DATA_DIR = getAppDataDir()
const DB_FILE_PATH = getPortfolioDatabasePath()

function createDefaultWebtoonProject(now: string): WebtoonProject {
  return {
    id: randomUUID(),
    cover_image: null,
    title: '새 웹툰 프로젝트',
    logline: null,
    description: null,
    planning: {
      content: null,
      attachments: [],
    },
    character_sheet: {
      content: null,
      attachments: [],
    },
    story: {
      content: null,
      attachments: [],
    },
    episodes: [],
    created_at: now,
    updated_at: now,
  }
}

function normalizeProfile(rawProfile: LegacyProfile | undefined): Profile {
  const now = new Date().toISOString()
  const legacyText =
    typeof rawProfile?.profile_text === 'string' ? rawProfile.profile_text : null

  return {
    id: typeof rawProfile?.id === 'string' ? rawProfile.id : DEFAULT_PROFILE_ID,
    profile_image:
      typeof rawProfile?.profile_image === 'string'
        ? rawProfile.profile_image
        : null,
    one_line_intro:
      typeof rawProfile?.one_line_intro === 'string'
        ? rawProfile.one_line_intro
        : legacyText,
    career: typeof rawProfile?.career === 'string' ? rawProfile.career : null,
    contact: typeof rawProfile?.contact === 'string' ? rawProfile.contact : null,
    created_at:
      typeof rawProfile?.created_at === 'string' ? rawProfile.created_at : now,
    updated_at:
      typeof rawProfile?.updated_at === 'string' ? rawProfile.updated_at : now,
  }
}

function normalizeWebtoonSection(
  rawSection: LegacyWebtoonSection | undefined,
): WebtoonSection {
  return {
    content: typeof rawSection?.content === 'string' ? rawSection.content : null,
    attachments: Array.isArray(rawSection?.attachments)
      ? rawSection.attachments.filter(
          (item: unknown): item is string =>
            typeof item === 'string' && item.length > 0,
        )
      : [],
  }
}

function normalizeEpisodeReadingMode(value: unknown): EpisodeReadingMode {
  return value === 'page' ? 'page' : 'scroll'
}

function sanitizeEpisodePageUrls(
  pages: string[],
  thumbnailUrl: string | null | undefined,
): string[] {
  const normalizedThumbnail =
    typeof thumbnailUrl === 'string' && thumbnailUrl.length > 0
      ? thumbnailUrl
      : null

  const unique = new Set<string>()
  const sanitized: string[] = []

  for (const page of pages) {
    if (typeof page !== 'string' || page.length === 0) {
      continue
    }

    if (normalizedThumbnail && page === normalizedThumbnail) {
      continue
    }

    if (unique.has(page)) {
      continue
    }

    unique.add(page)
    sanitized.push(page)
  }

  return sanitized
}

function normalizeManuscriptPages(
  rawEpisode: LegacyWebtoonEpisode | undefined,
): string[] {
  const pagesFromArray = Array.isArray(rawEpisode?.manuscript_pages)
    ? rawEpisode.manuscript_pages.filter(
        (item: unknown): item is string =>
          typeof item === 'string' && item.length > 0,
      )
    : []

  const pages = sanitizeEpisodePageUrls(
    pagesFromArray,
    typeof rawEpisode?.thumbnail_url === 'string' ? rawEpisode.thumbnail_url : null,
  )

  if (pages.length > 0) {
    return pages
  }

  if (
    typeof rawEpisode?.manuscript_url === 'string' &&
    rawEpisode.manuscript_url.length > 0
  ) {
    return sanitizeEpisodePageUrls(
      [rawEpisode.manuscript_url],
      typeof rawEpisode?.thumbnail_url === 'string' ? rawEpisode.thumbnail_url : null,
    )
  }

  return []
}

function normalizeWebtoonProject(
  rawProject: LegacyWebtoonProject | undefined,
  now: string,
): WebtoonProject {
  const defaultProject = createDefaultWebtoonProject(now)

  const normalizedEpisodes = Array.isArray(rawProject?.episodes)
    ? rawProject.episodes
        .map((episode, index) => {
          const parsedEpisodeNumber = Number(episode.episode_number)
          const episodeNumber =
            Number.isInteger(parsedEpisodeNumber) && parsedEpisodeNumber > 0
              ? parsedEpisodeNumber
              : index + 1
          const manuscriptPages = normalizeManuscriptPages(episode)

          return {
            id:
              typeof episode.id === 'string' && episode.id.length > 0
                ? episode.id
                : randomUUID(),
            episode_number: episodeNumber,
            title: typeof episode.title === 'string' ? episode.title : null,
            thumbnail_url:
              typeof episode.thumbnail_url === 'string'
                ? episode.thumbnail_url
                : null,
            reading_mode: normalizeEpisodeReadingMode(episode.reading_mode),
            manuscript_pages: manuscriptPages,
            manuscript_url: manuscriptPages[0] ?? null,
            created_at:
              typeof episode.created_at === 'string' ? episode.created_at : now,
          }
        })
        .sort((a, b) => a.episode_number - b.episode_number)
    : []

  return {
    id:
      typeof rawProject?.id === 'string' && rawProject.id.length > 0
        ? rawProject.id
        : randomUUID(),
    cover_image:
      typeof rawProject?.cover_image === 'string' ? rawProject.cover_image : null,
    title: typeof rawProject?.title === 'string' ? rawProject.title : defaultProject.title,
    logline: typeof rawProject?.logline === 'string' ? rawProject.logline : null,
    description:
      typeof rawProject?.description === 'string' ? rawProject.description : null,
    planning: normalizeWebtoonSection(rawProject?.planning),
    character_sheet: normalizeWebtoonSection(rawProject?.character_sheet),
    story: normalizeWebtoonSection(rawProject?.story),
    episodes: normalizedEpisodes,
    created_at:
      typeof rawProject?.created_at === 'string' ? rawProject.created_at : now,
    updated_at:
      typeof rawProject?.updated_at === 'string' ? rawProject.updated_at : now,
  }
}

function projectFromWebtoonPost(post: Post): WebtoonProject {
  return {
    id: randomUUID(),
    cover_image: post.thumbnail_url ?? post.post_images[0]?.image_url ?? null,
    title: post.title,
    logline: null,
    description: post.description,
    planning: {
      content: null,
      attachments: post.post_images.map((image) => image.image_url),
    },
    character_sheet: {
      content: null,
      attachments: [],
    },
    story: {
      content: null,
      attachments: [],
    },
    episodes: [],
    created_at: post.created_at,
    updated_at: post.created_at,
  }
}

function projectFromLegacyPlanner(
  rawPlanner: LegacyWebtoonPlanner | undefined,
  posts: Post[],
  now: string,
): WebtoonProject {
  const latestWebtoonPost = posts
    .filter((post) => post.category === 'webtoon')
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]

  return normalizeWebtoonProject(
    {
      id: randomUUID(),
      cover_image:
        typeof rawPlanner?.cover_image === 'string'
          ? rawPlanner.cover_image
          : latestWebtoonPost?.thumbnail_url ?? latestWebtoonPost?.post_images[0]?.image_url,
      title:
        typeof rawPlanner?.title === 'string'
          ? rawPlanner.title
          : latestWebtoonPost?.title,
      logline:
        typeof rawPlanner?.logline === 'string' ? rawPlanner.logline : null,
      description:
        typeof rawPlanner?.description === 'string'
          ? rawPlanner.description
          : latestWebtoonPost?.description,
      planning: rawPlanner?.planning,
      character_sheet: rawPlanner?.character_sheet,
      story: rawPlanner?.story,
      episodes: rawPlanner?.episodes,
      created_at:
        typeof rawPlanner?.created_at === 'string'
          ? rawPlanner.created_at
          : latestWebtoonPost?.created_at ?? now,
      updated_at:
        typeof rawPlanner?.updated_at === 'string'
          ? rawPlanner.updated_at
          : latestWebtoonPost?.created_at ?? now,
    },
    now,
  )
}

function createDefaultDatabase(): PortfolioDatabase {
  const now = new Date().toISOString()

  return {
    profile: {
      id: DEFAULT_PROFILE_ID,
      profile_image: null,
      one_line_intro: '안녕하세요! 작가 포트폴리오에 오신 것을 환영합니다.',
      career: null,
      contact: null,
      created_at: now,
      updated_at: now,
    },
    posts: [],
    webtoon_projects: [],
  }
}

async function ensureDatabaseFile() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await access(DB_FILE_PATH)
  } catch {
    const defaultDatabase = createDefaultDatabase()
    await writeFile(DB_FILE_PATH, JSON.stringify(defaultDatabase, null, 2), 'utf8')
  }
}

async function readDatabase(): Promise<PortfolioDatabase> {
  await ensureDatabaseFile()

  const raw = await readFile(DB_FILE_PATH, 'utf8')

  try {
    const parsed = JSON.parse(raw) as {
      profile?: LegacyProfile
      posts?: Post[]
      webtoon_projects?: LegacyWebtoonProject[]
      webtoon_planner?: LegacyWebtoonPlanner
    }

    if (!parsed || !parsed.profile || !Array.isArray(parsed.posts)) {
      throw new Error('Invalid local database shape')
    }

    const now = new Date().toISOString()
    const normalizedPosts = parsed.posts.map((post) => ({
      ...post,
      post_images: Array.isArray(post.post_images) ? post.post_images : [],
      comments: Array.isArray(post.comments) ? post.comments : [],
    }))

    let normalizedWebtoonProjects: WebtoonProject[]

    if (Array.isArray(parsed.webtoon_projects) && parsed.webtoon_projects.length > 0) {
      normalizedWebtoonProjects = parsed.webtoon_projects.map((project) =>
        normalizeWebtoonProject(project, now),
      )
    } else if (typeof parsed.webtoon_planner !== 'undefined') {
      normalizedWebtoonProjects = [
        projectFromLegacyPlanner(parsed.webtoon_planner, normalizedPosts, now),
      ]
    } else {
      normalizedWebtoonProjects = normalizedPosts
        .filter((post) => post.category === 'webtoon')
        .map((post) => projectFromWebtoonPost(post))
    }

    const normalizedDatabase: PortfolioDatabase = {
      profile: normalizeProfile(parsed.profile),
      posts: normalizedPosts,
      webtoon_projects: normalizedWebtoonProjects,
    }

    const needsProfileMigration =
      typeof parsed.profile.profile_text !== 'undefined' ||
      typeof parsed.profile.one_line_intro === 'undefined' ||
      typeof parsed.profile.career === 'undefined' ||
      typeof parsed.profile.contact === 'undefined'

    const needsWebtoonProjectsNormalization =
      !Array.isArray(parsed.webtoon_projects) ||
      parsed.webtoon_projects.some(
        (project) =>
          typeof project.id === 'undefined' ||
          typeof project.title === 'undefined' ||
          typeof project.logline === 'undefined' ||
          typeof project.description === 'undefined' ||
          typeof project.planning === 'undefined' ||
          typeof project.character_sheet === 'undefined' ||
          typeof project.story === 'undefined' ||
          !Array.isArray(project.episodes) ||
          project.episodes.some(
            (episode) =>
              (typeof episode.reading_mode !== 'string' ||
                (episode.reading_mode !== 'scroll' &&
                  episode.reading_mode !== 'page')) ||
              !Array.isArray(episode.manuscript_pages) ||
              (typeof episode.thumbnail_url === 'string' &&
                episode.thumbnail_url.length > 0 &&
                episode.manuscript_pages.some(
                  (page) => page === episode.thumbnail_url,
                )),
          ),
      ) ||
      typeof parsed.webtoon_planner !== 'undefined'

    if (needsProfileMigration || needsWebtoonProjectsNormalization) {
      await writeDatabase(normalizedDatabase)
    }

    return normalizedDatabase
  } catch {
    const fallback = createDefaultDatabase()
    await writeDatabase(fallback)
    return fallback
  }
}

async function writeDatabase(database: PortfolioDatabase) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DB_FILE_PATH, JSON.stringify(database, null, 2), 'utf8')
}

export async function getProfile(): Promise<Profile> {
  const database = await readDatabase()
  return database.profile
}

export async function updateProfile(input: {
  one_line_intro: string | null
  career: string | null
  contact: string | null
  profile_image: string | null
}): Promise<Profile> {
  const database = await readDatabase()

  database.profile = {
    ...database.profile,
    one_line_intro: input.one_line_intro,
    career: input.career,
    contact: input.contact,
    profile_image: input.profile_image,
    updated_at: new Date().toISOString(),
  }

  await writeDatabase(database)
  return database.profile
}

export async function getPostsByCategory(category: PostCategory): Promise<Post[]> {
  const database = await readDatabase()

  return database.posts
    .filter((post) => post.category === category)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .map((post) => ({
      ...post,
      post_images: [...post.post_images].sort((a, b) => a.sort_order - b.sort_order),
      comments: [...post.comments].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }))
}

export async function createPost(input: {
  category: PostCategory
  title: string
  description?: string | null
  thumbnail_url?: string | null
  additional_images?: string[]
}): Promise<Post> {
  const database = await readDatabase()
  const now = new Date().toISOString()
  const postId = randomUUID()

  const post: Post = {
    id: postId,
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    thumbnail_url: input.thumbnail_url ?? null,
    created_at: now,
    post_images: (input.additional_images ?? []).map((imageUrl, index) => ({
      id: randomUUID(),
      image_url: imageUrl,
      sort_order: index,
    })),
    comments: [],
  }

  database.posts.unshift(post)
  await writeDatabase(database)

  return post
}

export async function deletePostById(id: string): Promise<boolean> {
  const database = await readDatabase()
  const beforeCount = database.posts.length

  database.posts = database.posts.filter((post) => post.id !== id)

  if (database.posts.length === beforeCount) {
    return false
  }

  await writeDatabase(database)
  return true
}

export async function addCommentToPost(input: {
  post_id: string
  author_name: string
  content: string
}): Promise<Comment | null> {
  const database = await readDatabase()
  
  // 방명록(guestbook) 처리
  if (input.post_id === 'guestbook') {
    let guestbookPost = database.posts.find((item) => item.id === 'guestbook')
    
    // 방명록 포스트가 없으면 생성
    if (!guestbookPost) {
      guestbookPost = {
        id: 'guestbook',
        category: 'personal',
        title: 'Guestbook',
        description: 'Visitor Guestbook',
        thumbnail_url: null,
        created_at: new Date().toISOString(),
        post_images: [],
        comments: []
      }
      database.posts.push(guestbookPost)
    }

    const comment: Comment = {
      id: randomUUID(),
      author_name: input.author_name,
      content: input.content,
      created_at: new Date().toISOString(),
    }

    guestbookPost.comments.unshift(comment)
    await writeDatabase(database)
    return comment
  }

  const post = database.posts.find((item) => item.id === input.post_id)

  if (!post) {
    return null
  }

  const comment: Comment = {
    id: randomUUID(),
    author_name: input.author_name,
    content: input.content,
    created_at: new Date().toISOString(),
  }

  post.comments.unshift(comment)
  await writeDatabase(database)

  return comment
}

export async function getWebtoonProjects(): Promise<WebtoonProject[]> {
  const database = await readDatabase()

  return [...database.webtoon_projects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}

export async function getWebtoonProjectById(
  projectId: string,
): Promise<WebtoonProject | null> {
  const database = await readDatabase()
  const project = database.webtoon_projects.find((item) => item.id === projectId)

  if (!project) {
    return null
  }

  return {
    ...project,
    episodes: [...project.episodes].sort((a, b) => a.episode_number - b.episode_number),
  }
}

export async function createWebtoonProject(input: {
  title: string | null
  logline: string | null
  description: string | null
  cover_image: string | null
}): Promise<WebtoonProject> {
  const database = await readDatabase()
  const now = new Date().toISOString()

  const baseProject = createDefaultWebtoonProject(now)
  const newProject: WebtoonProject = {
    ...baseProject,
    title: input.title ?? baseProject.title,
    logline: input.logline,
    description: input.description,
    cover_image: input.cover_image,
  }

  database.webtoon_projects.unshift(newProject)
  await writeDatabase(database)

  return newProject
}

export async function updateWebtoonProjectMeta(
  projectId: string,
  input: {
    cover_image: string | null
    title: string | null
    logline: string | null
    description: string | null
  },
): Promise<WebtoonProject | null> {
  const database = await readDatabase()
  const targetIndex = database.webtoon_projects.findIndex(
    (item) => item.id === projectId,
  )

  if (targetIndex < 0) {
    return null
  }

  const targetProject = database.webtoon_projects[targetIndex]

  const updatedProject: WebtoonProject = {
    ...targetProject,
    cover_image: input.cover_image,
    title: input.title,
    logline: input.logline,
    description: input.description,
    updated_at: new Date().toISOString(),
  }

  database.webtoon_projects[targetIndex] = updatedProject
  await writeDatabase(database)

  return updatedProject
}

export async function updateWebtoonProjectSection(
  projectId: string,
  input: {
    section: 'planning' | 'character_sheet' | 'story'
    content: string | null
    attachments: string[]
  },
): Promise<WebtoonProject | null> {
  const database = await readDatabase()
  const targetIndex = database.webtoon_projects.findIndex(
    (item) => item.id === projectId,
  )

  if (targetIndex < 0) {
    return null
  }

  const targetProject = database.webtoon_projects[targetIndex]

  const updatedProject: WebtoonProject = {
    ...targetProject,
    [input.section]: {
      content: input.content,
      attachments: input.attachments,
    },
    updated_at: new Date().toISOString(),
  }

  database.webtoon_projects[targetIndex] = updatedProject
  await writeDatabase(database)

  return updatedProject
}

export async function addWebtoonEpisodeToProject(
  projectId: string,
  input: {
    episode_number: number
    title: string | null
    thumbnail_url: string | null
    reading_mode: EpisodeReadingMode
    manuscript_pages: string[]
    manuscript_url?: string | null
  },
): Promise<WebtoonEpisode | null> {
  const database = await readDatabase()
  const targetIndex = database.webtoon_projects.findIndex(
    (item) => item.id === projectId,
  )

  if (targetIndex < 0) {
    return null
  }

  const episodeNumber = Number(input.episode_number)
  if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
    return null
  }

  const targetProject = database.webtoon_projects[targetIndex]
  const alreadyExists = targetProject.episodes.some(
    (episode) => episode.episode_number === episodeNumber,
  )

  if (alreadyExists) {
    return null
  }

  const manuscriptPagesFromInput = Array.isArray(input.manuscript_pages)
    ? input.manuscript_pages.filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      )
    : []

  const manuscriptPages = [...manuscriptPagesFromInput]

  if (
    manuscriptPages.length === 0 &&
    typeof input.manuscript_url === 'string' &&
    input.manuscript_url.length > 0
  ) {
    manuscriptPages.push(input.manuscript_url)
  }

  const sanitizedManuscriptPages = sanitizeEpisodePageUrls(
    manuscriptPages,
    input.thumbnail_url,
  )

  if (sanitizedManuscriptPages.length === 0) {
    return null
  }

  const newEpisode: WebtoonEpisode = {
    id: randomUUID(),
    episode_number: episodeNumber,
    title: input.title,
    thumbnail_url: input.thumbnail_url,
    reading_mode: normalizeEpisodeReadingMode(input.reading_mode),
    manuscript_pages: sanitizedManuscriptPages,
    manuscript_url: sanitizedManuscriptPages[0] ?? null,
    created_at: new Date().toISOString(),
  }

  targetProject.episodes.push(newEpisode)
  targetProject.episodes.sort((a, b) => a.episode_number - b.episode_number)
  targetProject.updated_at = new Date().toISOString()

  database.webtoon_projects[targetIndex] = targetProject
  await writeDatabase(database)

  return newEpisode
}

export async function updateWebtoonEpisodeInProject(
  projectId: string,
  input: {
    episode_id: string
    title: string | null
    thumbnail_url: string | null
    reading_mode: EpisodeReadingMode
    manuscript_pages: string[]
    manuscript_url?: string | null
  },
): Promise<WebtoonProject | null> {
  const database = await readDatabase()
  const projectIndex = database.webtoon_projects.findIndex(
    (item) => item.id === projectId,
  )

  if (projectIndex < 0) {
    return null
  }

  const targetProject = database.webtoon_projects[projectIndex]
  const episodeIndex = targetProject.episodes.findIndex(
    (episode) => episode.id === input.episode_id,
  )

  if (episodeIndex < 0) {
    return null
  }

  const manuscriptPagesFromInput = Array.isArray(input.manuscript_pages)
    ? input.manuscript_pages.filter(
        (item): item is string => typeof item === 'string' && item.length > 0,
      )
    : []

  const manuscriptPages = [...manuscriptPagesFromInput]

  if (
    manuscriptPages.length === 0 &&
    typeof input.manuscript_url === 'string' &&
    input.manuscript_url.length > 0
  ) {
    manuscriptPages.push(input.manuscript_url)
  }

  const sanitizedManuscriptPages = sanitizeEpisodePageUrls(
    manuscriptPages,
    input.thumbnail_url,
  )

  if (sanitizedManuscriptPages.length === 0) {
    return null
  }

  const targetEpisode = targetProject.episodes[episodeIndex]

  const updatedEpisode: WebtoonEpisode = {
    ...targetEpisode,
    title: input.title,
    thumbnail_url: input.thumbnail_url,
    reading_mode: normalizeEpisodeReadingMode(input.reading_mode),
    manuscript_pages: sanitizedManuscriptPages,
    manuscript_url: sanitizedManuscriptPages[0] ?? null,
  }

  targetProject.episodes[episodeIndex] = updatedEpisode
  targetProject.episodes.sort((a, b) => a.episode_number - b.episode_number)
  targetProject.updated_at = new Date().toISOString()

  database.webtoon_projects[projectIndex] = targetProject
  await writeDatabase(database)

  return targetProject
}

export async function deleteWebtoonEpisodeFromProject(
  projectId: string,
  episodeId: string,
): Promise<WebtoonProject | null> {
  const database = await readDatabase()
  const projectIndex = database.webtoon_projects.findIndex(
    (item) => item.id === projectId,
  )

  if (projectIndex < 0) {
    return null
  }

  const targetProject = database.webtoon_projects[projectIndex]
  const filteredEpisodes = targetProject.episodes.filter(
    (episode) => episode.id !== episodeId,
  )

  if (filteredEpisodes.length === targetProject.episodes.length) {
    return null
  }

  const updatedProject: WebtoonProject = {
    ...targetProject,
    episodes: filteredEpisodes,
    updated_at: new Date().toISOString(),
  }

  database.webtoon_projects[projectIndex] = updatedProject
  await writeDatabase(database)

  return updatedProject
}
