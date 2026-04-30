import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: {
      commercial: {
        select: {
          id: true, nom: true, prenom: true, telephone: true,
          region: true, statut: true, equipeId: true,
          equipe: { select: { nom: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users.map(u => ({ ...u, password: undefined })))
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, userRole, nom, prenom, telephone, region, equipeId } = body

  if (!email || !password || !nom || !prenom) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
  }

  const hashedPw = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPw,
      role: userRole || 'COMMERCIAL',
      commercial: {
        create: {
          nom,
          prenom,
          telephone,
          region,
          statut: 'ACTIF',
          equipeId: equipeId || null,
        },
      },
    },
    include: { commercial: true },
  })

  return NextResponse.json({ ...user, password: undefined }, { status: 201 })
}
