import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { generateRef } from '@/app/lib/utils'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const statut = searchParams.get('statut') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (search) where.OR = [{ clientNom: { contains: search } }, { reference: { contains: search } }]
  if (statut) where.statut = statut

  const contrats = await prisma.contrat.findMany({
    where,
    include: { commercial: { select: { nom: true, prenom: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(contrats)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const data = await req.json()

  const contrat = await prisma.contrat.create({
    data: {
      ...data,
      reference: data.reference || generateRef(),
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId,
    },
  })
  return NextResponse.json(contrat, { status: 201 })
}
