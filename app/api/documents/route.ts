import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || ''
  const statut = searchParams.get('statut') || ''
  const cId = searchParams.get('commercialId') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (type) where.type = type
  if (statut) where.statut = statut
  if (cId && role !== 'COMMERCIAL') where.commercialId = cId

  const documents = await prisma.document.findMany({
    where,
    include: { commercial: { select: { nom: true, prenom: true } } },
    orderBy: [{ commercialId: 'asc' }, { type: 'asc' }],
  })
  return NextResponse.json(documents)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const data = await req.json()

  const document = await prisma.document.create({
    data: {
      ...data,
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId,
    },
  })
  return NextResponse.json(document, { status: 201 })
}
