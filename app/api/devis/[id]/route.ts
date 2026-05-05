import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const devis = await prisma.devis.findUnique({
    where: { id },
    include: {
      commercial: { select: { nom: true, prenom: true } },
      prospect: { select: { raisonSociale: true, contactNom: true, email: true, telephone: true, ville: true } },
      lignes: { orderBy: { ordre: 'asc' } },
    },
  })
  if (!devis) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json(devis)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { lignes, ...data } = await req.json()

  if (lignes) {
    await prisma.ligneDevis.deleteMany({ where: { devisId: id } })
    await prisma.ligneDevis.createMany({
      data: lignes.map((l: any, i: number) => ({ ...l, devisId: id, ordre: i }))
    })
  }

  const devis = await prisma.devis.update({
    where: { id },
    data,
    include: { lignes: { orderBy: { ordre: 'asc' } } },
  })
  return NextResponse.json(devis)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devis.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
