import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut') || ''
  const etape = searchParams.get('etape') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (statut) where.statut = statut
  if (etape) where.etape = etape

  const opportunites = await prisma.opportunite.findMany({
    where,
    include: {
      commercial: { select: { nom: true, prenom: true } },
      prospect: { select: { raisonSociale: true } },
    },
    orderBy: [{ statut: 'asc' }, { montantEstime: 'desc' }],
  })
  return NextResponse.json(opportunites)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const data = await req.json()

  const opportunite = await prisma.opportunite.create({
    data: {
      ...data,
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId,
    },
  })
  return NextResponse.json(opportunite, { status: 201 })
}
