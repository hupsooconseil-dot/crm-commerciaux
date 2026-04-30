import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const cId = searchParams.get('commercialId') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (cId && role !== 'COMMERCIAL') where.commercialId = cId

  const crvs = await prisma.cRV.findMany({
    where,
    include: {
      commercial: { select: { nom: true, prenom: true } },
      prospect: { select: { raisonSociale: true } },
    },
    orderBy: { dateVisite: 'desc' },
    take: 100,
  })
  return NextResponse.json(crvs)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const data = await req.json()

  const crv = await prisma.cRV.create({
    data: {
      ...data,
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId,
    },
  })
  return NextResponse.json(crv, { status: 201 })
}
