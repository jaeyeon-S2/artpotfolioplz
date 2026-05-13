require('tsx/cjs')

const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
const { mkdir, writeFile } = require('fs/promises')

require('dotenv').config()

const repoRoot = path.resolve(__dirname, '..')
const frontendDistDir = path.join(__dirname, 'dist')
const uploadsDir = process.env.APP_UPLOADS_DIR || path.join(repoRoot, 'uploads')
const dataDir = process.env.APP_DATA_DIR || path.join(repoRoot, 'data')

process.env.APP_ROOT_DIR = process.env.APP_ROOT_DIR || repoRoot
process.env.APP_DATA_DIR = dataDir
process.env.APP_UPLOADS_DIR = uploadsDir

const {
  addCommentToPost,
  addWebtoonEpisodeToProject,
  createPost,
  createWebtoonProject,
  deletePostById,
  deleteWebtoonEpisodeFromProject,
  getPostsByCategory,
  getProfile,
  getWebtoonProjectById,
  getWebtoonProjects,
  updateProfile,
  updateWebtoonEpisodeInProject,
  updateWebtoonProjectMeta,
  updateWebtoonProjectSection,
} = require('../frontend/lib/local-db.ts')

const { getUploadsDir } = require('../frontend/lib/runtime-paths.ts')

const app = express()
const upload = multer({ storage: multer.memoryStorage() })
const port = Number(process.env.PORT || 3000)
const maxUploadSizeBytes = 30 * 1024 * 1024

function sendJson(response, statusCode, payload) {
  return response.status(statusCode).json(payload)
}

function toText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function toNullableText(value) {
  const text = toText(value)
  return text.length > 0 ? text : null
}

function parseEpisodeReadingMode(value) {
  return value === 'page' ? 'page' : 'scroll'
}

function sanitizeBaseName(fileName) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '')
  return withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function parseCommentAuthorName(payload) {
  return toText(payload.author_name || payload.name)
}

function createUploadedFileName(fileName) {
  const extensionMatch = fileName.match(/\.([a-zA-Z0-9]+)$/)
  const rawExtension = extensionMatch?.[1]?.toLowerCase() ?? 'bin'
  const safeExtension = rawExtension.replace(/[^a-z0-9]/g, '') || 'bin'
  const safeBaseName = sanitizeBaseName(fileName)
  return `${Date.now()}-${safeBaseName || 'file'}-${randomUUID()}.${safeExtension}`
}

app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(getUploadsDir(), { fallthrough: true }))

app.get('/api/health', (_request, response) => {
  sendJson(response, 200, { status: 'ok', message: 'Backend is running' })
})

app.get('/api/profile', async (_request, response) => {
  try {
    const profile = await getProfile()
    sendJson(response, 200, profile)
  } catch (error) {
    console.error('Get profile error:', error)
    sendJson(response, 500, { error: 'Failed to load profile' })
  }
})

app.put('/api/profile', async (request, response) => {
  try {
    const profile = await updateProfile({
      one_line_intro:
        typeof request.body.one_line_intro === 'string'
          ? request.body.one_line_intro
          : typeof request.body.profile_text === 'string'
            ? request.body.profile_text
            : null,
      career: toNullableText(request.body.career),
      contact: toNullableText(request.body.contact),
      profile_image: toNullableText(request.body.profile_image),
    })

    sendJson(response, 200, { success: true, profile })
  } catch (error) {
    console.error('Profile update error:', error)
    sendJson(response, 500, { error: 'Failed to update profile' })
  }
})

app.get('/api/posts', async (_request, response) => {
  try {
    const [webtoonPosts, workPosts, personalPosts] = await Promise.all([
      getPostsByCategory('webtoon'),
      getPostsByCategory('works'),
      getPostsByCategory('personal'),
    ])

    const posts = [...webtoonPosts, ...workPosts, ...personalPosts]
    sendJson(response, 200, posts)
  } catch (error) {
    console.error('Get posts error:', error)
    sendJson(response, 500, { error: 'Failed to load posts' })
  }
})

app.post('/api/posts', async (request, response) => {
  try {
    const category = request.body.category
    const title = toText(request.body.title)

    if (!['webtoon', 'works', 'personal'].includes(category)) {
      return sendJson(response, 400, { error: 'Invalid category' })
    }

    if (!title) {
      return sendJson(response, 400, { error: 'Title is required' })
    }

    const post = await createPost({
      category,
      title,
      description: toNullableText(request.body.description),
      thumbnail_url: toNullableText(request.body.thumbnail_url),
      additional_images: Array.isArray(request.body.additional_images)
        ? request.body.additional_images.filter(
            (item) => typeof item === 'string' && item.trim().length > 0,
          )
        : [],
    })

    sendJson(response, 201, post)
  } catch (error) {
    console.error('Create post error:', error)
    sendJson(response, 500, { error: 'Failed to create post' })
  }
})

app.get('/api/posts/:id', async (request, response) => {
  try {
    const { id } = request.params

    if (id === 'guestbook') {
      const posts = await getPostsByCategory('personal')
      const guestbook = posts.find((post) => post.id === 'guestbook')

      if (!guestbook) {
        return sendJson(response, 200, { id: 'guestbook', comments: [] })
      }

      return sendJson(response, 200, guestbook)
    }

    const posts = await Promise.all([
      getPostsByCategory('webtoon'),
      getPostsByCategory('works'),
      getPostsByCategory('personal'),
    ])
    const post = posts.flat().find((item) => item.id === id)

    if (!post) {
      return sendJson(response, 404, { error: 'Post not found' })
    }

    sendJson(response, 200, post)
  } catch (error) {
    console.error('Get post error:', error)
    sendJson(response, 500, { error: 'Internal Server Error' })
  }
})

app.delete('/api/posts/:id', async (request, response) => {
  try {
    const deleted = await deletePostById(request.params.id)

    if (!deleted) {
      return sendJson(response, 404, { error: 'Post not found' })
    }

    sendJson(response, 200, { success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    sendJson(response, 500, { error: 'Failed to delete post' })
  }
})

app.post('/api/comments', async (request, response) => {
  try {
    const postId = toText(request.body.post_id)
    const authorName = parseCommentAuthorName(request.body)
    const content = toText(request.body.content)

    if (!postId || !authorName || !content) {
      return sendJson(response, 400, { error: 'Invalid comment payload' })
    }

    const comment = await addCommentToPost({
      post_id: postId,
      author_name: authorName,
      content,
    })

    if (!comment) {
      return sendJson(response, 404, { error: 'Post not found' })
    }

    sendJson(response, 200, comment)
  } catch (error) {
    console.error('Create comment error:', error)
    sendJson(response, 500, { error: 'Failed to create comment' })
  }
})

app.get('/api/webtoon', async (_request, response) => {
  try {
    const projects = await getWebtoonProjects()
    sendJson(response, 200, projects)
  } catch (error) {
    console.error('Get webtoon projects error:', error)
    sendJson(response, 500, { error: 'Failed to load webtoon projects' })
  }
})

app.post('/api/webtoon', async (request, response) => {
  try {
    const project = await createWebtoonProject({
      title: toNullableText(request.body.title),
      logline: toNullableText(request.body.logline),
      description: toNullableText(request.body.description),
      cover_image: toNullableText(request.body.cover_image),
    })

    sendJson(response, 201, project)
  } catch (error) {
    console.error('Create webtoon project error:', error)
    sendJson(response, 500, { error: 'Failed to create webtoon project' })
  }
})

app.get('/api/webtoon/:projectId', async (request, response) => {
  try {
    const project = await getWebtoonProjectById(request.params.projectId)

    if (!project) {
      return sendJson(response, 404, { error: 'Project not found' })
    }

    sendJson(response, 200, project)
  } catch (error) {
    console.error('Get webtoon project error:', error)
    sendJson(response, 500, { error: 'Failed to load webtoon project' })
  }
})

app.put('/api/webtoon/:projectId', async (request, response) => {
  try {
    const { projectId } = request.params

    if (request.body.type === 'meta') {
      const project = await updateWebtoonProjectMeta(projectId, {
        cover_image: toNullableText(request.body.cover_image),
        title: toNullableText(request.body.title),
        logline: toNullableText(request.body.logline),
        description: toNullableText(request.body.description),
      })

      if (!project) {
        return sendJson(response, 404, { error: 'Project not found' })
      }

      return sendJson(response, 200, { success: true, project })
    }

    if (request.body.type === 'section') {
      const section = request.body.section
      if (!['planning', 'character_sheet', 'story'].includes(section)) {
        return sendJson(response, 400, { error: 'Invalid section' })
      }

      const project = await updateWebtoonProjectSection(projectId, {
        section,
        content: toNullableText(request.body.content),
        attachments: Array.isArray(request.body.attachments)
          ? request.body.attachments.filter(
              (item) => typeof item === 'string' && item.length > 0,
            )
          : [],
      })

      if (!project) {
        return sendJson(response, 404, { error: 'Project not found' })
      }

      return sendJson(response, 200, { success: true, project })
    }

    if (request.body.type === 'episode') {
      const episodeId = toText(request.body.episode_id)

      if (!episodeId) {
        return sendJson(response, 400, { error: 'Invalid episode id' })
      }

      const manuscriptPages = Array.isArray(request.body.manuscript_pages)
        ? request.body.manuscript_pages.filter(
            (item) => typeof item === 'string' && item.length > 0,
          )
        : []

      if (manuscriptPages.length === 0) {
        return sendJson(response, 400, { error: '원고 이미지를 1장 이상 유지해 주세요.' })
      }

      const project = await updateWebtoonEpisodeInProject(projectId, {
        episode_id: episodeId,
        title: toNullableText(request.body.title),
        thumbnail_url: toNullableText(request.body.thumbnail_url),
        reading_mode: parseEpisodeReadingMode(request.body.reading_mode),
        manuscript_pages: manuscriptPages,
        manuscript_url: manuscriptPages[0] || null,
      })

      if (!project) {
        return sendJson(response, 404, { error: 'Episode not found or payload is invalid' })
      }

      return sendJson(response, 200, { success: true, project })
    }

    sendJson(response, 400, { error: 'Invalid update type' })
  } catch (error) {
    console.error('Update webtoon project error:', error)
    sendJson(response, 500, { error: 'Failed to update webtoon project' })
  }
})

app.post('/api/webtoon/:projectId', async (request, response) => {
  try {
    const episodeNumber = Number(request.body.episode_number)

    if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
      return sendJson(response, 400, { error: 'Invalid episode number' })
    }

    const manuscriptPages = Array.isArray(request.body.manuscript_pages)
      ? request.body.manuscript_pages.filter(
          (item) => typeof item === 'string' && item.length > 0,
        )
      : []

    if (
      manuscriptPages.length === 0 &&
      typeof request.body.manuscript_url === 'string' &&
      request.body.manuscript_url.length > 0
    ) {
      manuscriptPages.push(request.body.manuscript_url)
    }

    if (manuscriptPages.length === 0) {
      return sendJson(response, 400, { error: '원고 이미지를 1장 이상 업로드해 주세요.' })
    }

    const createdEpisode = await addWebtoonEpisodeToProject(request.params.projectId, {
      episode_number: episodeNumber,
      title: toNullableText(request.body.title),
      thumbnail_url: toNullableText(request.body.thumbnail_url),
      reading_mode: parseEpisodeReadingMode(request.body.reading_mode),
      manuscript_pages: manuscriptPages,
      manuscript_url: manuscriptPages[0] || null,
    })

    if (!createdEpisode) {
      return sendJson(response, 400, {
        error: 'Episode number already exists or payload is invalid',
      })
    }

    sendJson(response, 201, createdEpisode)
  } catch (error) {
    console.error('Create webtoon episode error:', error)
    sendJson(response, 500, { error: 'Failed to create webtoon episode' })
  }
})

app.delete('/api/webtoon/:projectId', async (request, response) => {
  try {
    const episodeId = toText(request.query.episodeId)

    if (!episodeId) {
      return sendJson(response, 400, { error: 'Invalid episode id' })
    }

    const project = await deleteWebtoonEpisodeFromProject(request.params.projectId, episodeId)

    if (!project) {
      return sendJson(response, 404, { error: 'Episode not found' })
    }

    sendJson(response, 200, { success: true, project })
  } catch (error) {
    console.error('Delete webtoon episode error:', error)
    sendJson(response, 500, { error: 'Failed to delete webtoon episode' })
  }
})

app.post('/api/upload', upload.single('file'), async (request, response) => {
  try {
    const file = request.file

    if (!file) {
      return sendJson(response, 400, { error: 'No file provided' })
    }

    if (!file.mimetype.startsWith('image/')) {
      return sendJson(response, 400, { error: 'Only image uploads are supported' })
    }

    if (file.size > maxUploadSizeBytes) {
      return sendJson(response, 400, { error: 'File is too large. Maximum size is 30MB.' })
    }

    await mkdir(getUploadsDir(), { recursive: true })

    const uniqueFileName = `${Date.now()}-${randomUUID()}${path.extname(file.originalname) || '.bin'}`
    await writeFile(path.join(getUploadsDir(), uniqueFileName), file.buffer)

    sendJson(response, 200, { url: `/uploads/${uniqueFileName}` })
  } catch (error) {
    console.error('Upload error:', error)
    sendJson(response, 500, { error: 'Upload failed' })
  }
})

app.post('/api/upload/file', upload.single('file'), async (request, response) => {
  try {
    const file = request.file

    if (!file) {
      return sendJson(response, 400, { error: 'No file provided' })
    }

    if (file.size > maxUploadSizeBytes) {
      return sendJson(response, 400, { error: 'File is too large. Maximum size is 30MB.' })
    }

    await mkdir(getUploadsDir(), { recursive: true })

    const uniqueFileName = `${Date.now()}-${createUploadedFileName(file.originalname)}`
    await writeFile(path.join(getUploadsDir(), uniqueFileName), file.buffer)

    sendJson(response, 200, { url: `/uploads/${uniqueFileName}` })
  } catch (error) {
    console.error('File upload error:', error)
    sendJson(response, 500, { error: 'Upload failed' })
  }
})

app.post('/api/chat', async (request, response) => {
  try {
    const message = toText(request.body.message || request.body.text)
    const latestHistory = Array.isArray(request.body.messages) ? request.body.messages : []
    const lastUserMessage =
      [...latestHistory].reverse().find((item) => item?.role === 'user')?.content || message

    const lowerMessage = String(lastUserMessage || '').toLowerCase()
    let reply = '안녕하세요. 포트폴리오에서 궁금한 점을 말씀해 주세요.'

    if (lowerMessage.includes('프로필') || lowerMessage.includes('작가')) {
      reply = '작가 프로필과 작업물은 상단 메뉴에서 바로 확인하실 수 있습니다.'
    } else if (lowerMessage.includes('웹툰')) {
      reply = '웹툰 기획은 프로젝트별 상세 페이지에서 콘셉트와 에피소드를 확인할 수 있습니다.'
    } else if (lowerMessage.includes('방명록')) {
      reply = '방명록에는 방문자 메시지를 남길 수 있습니다.'
    } else if (lowerMessage.includes('업로드') || lowerMessage.includes('파일')) {
      reply = '이미지 업로드는 업로드 버튼을 통해 바로 진행할 수 있습니다.'
    } else if (message) {
      reply = `"${message}"에 대해 더 자세히 알려주시면 제가 이어서 안내하겠습니다.`
    }

    sendJson(response, 200, { message: reply })
  } catch (error) {
    console.error('Chat error:', error)
    sendJson(response, 500, { error: 'Failed to respond to chat' })
  }
})

if (fs.existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir, { extensions: ['html'] }))
}

app.get('*', (request, response, next) => {
  if (request.path.startsWith('/api/') || request.path.startsWith('/uploads/')) {
    return next()
  }

  const indexPath = path.join(frontendDistDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    return response.sendFile(indexPath)
  }

  return sendJson(response, 503, {
    error: 'Frontend build not found. Run the frontend build first.',
  })
})

app.listen(port, () => {
  console.log(`Node server running on http://localhost:${port}`)
})
