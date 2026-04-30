import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const commercialId = req.headers.get('x-commercial-id')
  if (!commercialId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const data = await req.json()
  const result = await prisma.formationCommercial.upsert({
    where: { commercialId_formationId: { commercialId, formationId: id } },
    create: {
      commercialId,
      formationId: id,
      statut: data.statut || 'EN_COURS',
      progression: data.progression || 0,
      score: data.score || null,
      dateDebut: new Date(),
      dateFin: data.statut === 'TERMINE' ? new Date() : null,
    },
    update: {
      statut: data.statut || 'EN_COURS',
      progression: data.progression || 0,
      score: data.score || null,
      dateFin: data.statut === 'TERMINE' ? new Date() : null,
    },
  })
  return NextResponse.json(result)
}
