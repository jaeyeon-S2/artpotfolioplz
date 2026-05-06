import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getUploadsDir } from '@/lib/runtime-paths'

export const runtime = 'nodejs'

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 30MB.' },
        { status: 400 },
      )
    }

    const extensionMatch = file.name.match(/\.([a-zA-Z0-9]+)$/)
    const rawExtension = extensionMatch?.[1]?.toLowerCase() ?? 'bin'
    const safeExtension = rawExtension.replace(/[^a-z0-9]/g, '') || 'bin'

    const uploadsDirectory = getUploadsDir()
    await mkdir(uploadsDirectory, { recursive: true })

    const uniqueFileName = `${Date.now()}-${randomUUID()}.${safeExtension}`
    const targetPath = path.join(uploadsDirectory, uniqueFileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(targetPath, buffer)

    return NextResponse.json({ url: `/uploads/${uniqueFileName}` })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
