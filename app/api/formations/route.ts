import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || ''
  const categorie = searchParams.get('categorie') || ''

  const where: any = {}
  if (type) where.type = type
  if (categorie) where.categorie = categorie

  const formations = await prisma.formation.findMany({
    where,
    include: {
      _count: { select: { modules: true, commerciaux: true } },
      commerciaux: commercialId
        ? {
            where: { commercialId },
            select: { statut: true, progression: true, score: true },
          }
        : false,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(formations)
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const data = await req.json()
  const formation = await prisma.formation.create({ data })
  return NextResponse.json(formation, { status: 201 })
}
