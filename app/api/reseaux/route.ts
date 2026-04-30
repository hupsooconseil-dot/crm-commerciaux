import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const reseaux = await prisma.reseau.findMany({
    include: {
      chefReseau: { select: { nom: true, prenom: true } },
      equipes: {
        include: {
          chefEquipe: { select: { nom: true, prenom: true } },
          membres: { select: { id: true, nom: true, prenom: true, statut: true } },
        },
      },
    },
    orderBy: { nom: 'asc' },
  })
  return NextResponse.json(reseaux)
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await request.json()
  const reseau = await prisma.reseau.create({ data: body })
  return NextResponse.json(reseau, { status: 201 })
}
