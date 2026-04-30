import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { userRole, password, nom, prenom, telephone, region, statut, equipeId } = body

  const updates: any = {}
  if (userRole) updates.role = userRole
  if (password) updates.password = await bcrypt.hash(password, 10)

  const user = await prisma.user.update({
    where: { id },
    data: updates,
  })

  if (nom || prenom || telephone !== undefined || region !== undefined || statut || equipeId !== undefined) {
    const commercialUpdates: any = {}
    if (nom) commercialUpdates.nom = nom
    if (prenom) commercialUpdates.prenom = prenom
    if (telephone !== undefined) commercialUpdates.telephone = telephone
    if (region !== undefined) commercialUpdates.region = region
    if (statut) commercialUpdates.statut = statut
    if (equipeId !== undefined) commercialUpdates.equipeId = equipeId || null

    await prisma.commercial.update({ where: { userId: id }, data: commercialUpdates })
  }

  return NextResponse.json({ ...user, password: undefined })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
