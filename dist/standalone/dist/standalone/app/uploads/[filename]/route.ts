import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { getUploadsDir } from '@/lib/runtime-paths'

export const runtime = 'nodejs'

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params
    const safeFileName = path.basename(filename)

    if (!safeFileName || safeFileName !== filename) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }

    const filePath = path.join(getUploadsDir(), safeFileName)

    try {
      const fileBuffer = await readFile(filePath)
      const contentType =
        CONTENT_TYPES[path.extname(safeFileName).toLowerCase()] ??
        'application/octet-stream'

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Upload file serve error:', error)
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 })
  }
}