import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

    const filename = `documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const blob = await put(filename, file, { access: 'public' })

    return NextResponse.json({ url: blob.url })
  } catch (e: any) {
    console.error('[POST /api/upload]', e)
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
