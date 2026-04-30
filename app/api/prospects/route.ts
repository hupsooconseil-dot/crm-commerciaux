import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const statut = searchParams.get('statut') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (search) {
    where.OR = [
      { raisonSociale: { contains: search } },
      { contactNom: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (statut) where.statut = statut

  const prospects = await prisma.prospect.findMany({
    where,
    include: {
      commercial: { select: { nom: true, prenom: true } },
      _count: { select: { crv: true, opportunites: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(prospects)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const data = await req.json()

  const prospect = await prisma.prospect.create({
    data: {
      ...data,
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId,
    },
  })
  return NextResponse.json(prospect, { status: 201 })
}
