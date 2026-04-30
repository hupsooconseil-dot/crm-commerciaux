import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role')
  const commercialId = request.headers.get('x-commercial-id')

  const isAdmin = role === 'ADMIN' || role === 'MANAGER'

  const factures = await prisma.facture.findMany({
    where: isAdmin ? {} : { commercialId: commercialId || undefined },
    include: {
      commercial: { select: { nom: true, prenom: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(factures)
}

export async function POST(request: NextRequest) {
  const commercialId = request.headers.get('x-commercial-id')
  if (!commercialId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { numero, montantHT, tva = 20, notes, periode, dateFacture } = body

  if (!numero || !montantHT) {
    return NextResponse.json({ error: 'Numéro et montant HT requis' }, { status: 400 })
  }

  const montantTTC = parseFloat(montantHT) * (1 + parseFloat(tva) / 100)

  const facture = await prisma.facture.create({
    data: {
      commercialId,
      numero,
      montantHT: parseFloat(montantHT),
      tva: parseFloat(tva),
      montantTTC,
      notes,
      periode,
      dateFacture: dateFacture ? new Date(dateFacture) : null,
      statut: 'EN_ATTENTE',
    },
  })

  return NextResponse.json(facture, { status: 201 })
}
