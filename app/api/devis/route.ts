import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

function genRef() {
  const d = new Date()
  return `DEV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
}

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const statut = searchParams.get('statut') || ''

  const where: any = role === 'COMMERCIAL' ? { commercialId: commercialId || undefined } : {}
  if (statut) where.statut = statut
  if (search) where.OR = [
    { clientNom: { contains: search } },
    { reference: { contains: search } },
    { clientVille: { contains: search } },
  ]

  const devis = await prisma.devis.findMany({
    where,
    include: {
      commercial: { select: { nom: true, prenom: true } },
      lignes: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(devis)
}

export async function POST(req: NextRequest) {
  const commercialId = req.headers.get('x-commercial-id')
  const role = req.headers.get('x-user-role')
  const { lignes, ...data } = await req.json()

  const devis = await prisma.devis.create({
    data: {
      ...data,
      reference: data.reference || genRef(),
      commercialId: role === 'COMMERCIAL' ? commercialId! : data.commercialId || commercialId,
      lignes: lignes ? {
        create: lignes.map((l: any, i: number) => ({ ...l, ordre: i }))
      } : undefined,
    },
    include: { lignes: true },
  })
  return NextResponse.json(devis, { status: 201 })
}
