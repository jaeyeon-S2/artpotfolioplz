import { updateProfile } from '@/lib/local-db'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function PUT(request: Request) {
  try {
    const payload = await request.json()
    const oneLineIntro =
      typeof payload.one_line_intro === 'string'
        ? payload.one_line_intro
        : typeof payload.profile_text === 'string'
          ? payload.profile_text
          : null

    const profile = await updateProfile({
      one_line_intro: oneLineIntro,
      career: typeof payload.career === 'string' ? payload.career : null,
      contact: typeof payload.contact === 'string' ? payload.contact : null,
      profile_image:
        typeof payload.profile_image === 'string' ? payload.profile_image : null,
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
