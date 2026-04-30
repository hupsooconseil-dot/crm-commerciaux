import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      commercial: { select: { nom: true, prenom: true } },
      crv: { orderBy: { dateVisite: 'desc' } },
      opportunites: true,
    },
  })
  if (!prospect) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json(prospect)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const prospect = await prisma.prospect.update({ where: { id }, data })
  return NextResponse.json(prospect)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.prospect.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
