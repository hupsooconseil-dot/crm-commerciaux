import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const statut = searchParams.get('statut') || ''
  const periode = searchParams.get('periode') || ''
  const search = searchParams.get('search') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (statut) where.statut = statut
  if (periode) where.periode = periode
  if (search) {
    where.OR = [
      { contrat: { clientNom: { contains: search } } },
      { contrat: { reference: { contains: search } } },
      { periode: { contains: search } },
    ]
  }

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      commercial: { select: { nom: true, prenom: true } },
      contrat: { select: { reference: true, clientNom: true, produit: true } },
    },
    orderBy: [{ periode: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(commissions)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const data = await req.json()

  const commission = await prisma.commission.create({
    data: {
      ...data,
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId,
      montantCommission: (data.montantBase * data.taux) / 100,
    },
  })
  return NextResponse.json(commission, { status: 201 })
}
