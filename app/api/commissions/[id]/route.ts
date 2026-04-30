import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  if (data.montantBase !== undefined && data.taux !== undefined) {
    data.montantCommission = (data.montantBase * data.taux) / 100
  }
  const commission = await prisma.commission.update({ where: { id }, data })
  return NextResponse.json(commission)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.commission.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
