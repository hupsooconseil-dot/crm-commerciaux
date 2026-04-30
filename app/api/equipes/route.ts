import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  const commercialId = request.headers.get('x-commercial-id')

  let where: any = {}
  if (role === 'CHEF_RESEAU') {
    const reseaux = await prisma.reseau.findMany({ where: { chefReseauId: commercialId || undefined } })
    where = { reseauId: { in: reseaux.map((r: any) => r.id) } }
  } else if (role === 'CHEF_EQUIPE') {
    where = { chefEquipeId: commercialId || undefined }
  }

  const equipes = await prisma.equipe.findMany({
    where,
    include: {
      reseau: true,
      chefEquipe: { select: { nom: true, prenom: true } },
      membres: { select: { id: true, nom: true, prenom: true, statut: true, user: { select: { role: true } } } },
    },
    orderBy: { nom: 'asc' },
  })
  return NextResponse.json(equipes)
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await request.json()
  const equipe = await prisma.equipe.create({ data: body })
  return NextResponse.json(equipe, { status: 201 })
}
