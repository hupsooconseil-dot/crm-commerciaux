import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()
  const equipe = await prisma.equipe.update({ where: { id }, data: body })
  return NextResponse.json(equipe)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { id } = await params
  await prisma.commercial.updateMany({ where: { equipeId: id }, data: { equipeId: null } })
  await prisma.equipe.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
