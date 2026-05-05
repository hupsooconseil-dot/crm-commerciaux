import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contrat = await prisma.contrat.findUnique({
    where: { id },
    include: {
      commercial: { select: { nom: true, prenom: true } },
      contratDocs: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!contrat) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json(contrat)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const contrat = await prisma.contrat.update({ where: { id }, data })
  return NextResponse.json(contrat)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.contrat.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
