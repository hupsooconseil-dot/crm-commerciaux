import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')

  const where: any = {}
  if (role === 'COMMERCIAL') {
    where.OR = [{ commercialId: commercialId || undefined }, { commercialId: null }]
  }

  const alertes = await prisma.alerte.findMany({
    where,
    include: {
      commercial: { select: { nom: true, prenom: true } },
    },
    orderBy: [{ estLue: 'asc' }, { createdAt: 'desc' }],
    take: 50,
  })
  return NextResponse.json(alertes)
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const data = await req.json()
  const alerte = await prisma.alerte.create({ data })
  return NextResponse.json(alerte, { status: 201 })
}
