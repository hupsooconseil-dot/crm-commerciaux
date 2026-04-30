import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get('x-user-role')
  const isAdmin = role === 'ADMIN' || role === 'MANAGER'

  if (!isAdmin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { statut } = body

  const facture = await prisma.facture.update({
    where: { id },
    data: {
      statut,
      dateTraitement: statut !== 'EN_ATTENTE' ? new Date() : null,
    },
  })

  return NextResponse.json(facture)
}
