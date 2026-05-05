import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const kits = await prisma.kit.findMany({
      where: { actif: true },
      orderBy: [{ categorie: 'asc' }, { prixHT: 'asc' }],
    })
    return NextResponse.json(kits)
  } catch (e: any) {
    console.error('[GET /api/kits]', e)
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}
