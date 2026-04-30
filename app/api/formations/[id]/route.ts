import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const formation = await prisma.formation.findUnique({
    where: { id },
    include: {
      modules: {
        include: { questions: { orderBy: { ordre: 'asc' } } },
        orderBy: { ordre: 'asc' },
      },
      _count: { select: { commerciaux: true } },
    },
  })
  if (!formation) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json(formation)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const formation = await prisma.formation.update({ where: { id }, data })
  return NextResponse.json(formation)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.formation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
