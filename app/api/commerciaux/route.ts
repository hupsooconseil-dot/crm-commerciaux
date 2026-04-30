import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const statut = searchParams.get('statut') || ''
  const region = searchParams.get('region') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { nom: { contains: search } },
      { prenom: { contains: search } },
      { user: { email: { contains: search } } },
    ]
  }
  if (statut) where.statut = statut
  if (region) where.region = region

  const commerciaux = await prisma.commercial.findMany({
    where,
    include: {
      user: { select: { email: true, role: true } },
      _count: {
        select: {
          prospects: true,
          opportunites: true,
          contrats: true,
          crv: true,
        },
      },
    },
    orderBy: [{ statut: 'asc' }, { nom: 'asc' }],
  })

  return NextResponse.json(commerciaux)
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()
  const { email, password, role: userRole = 'COMMERCIAL', ...commercialData } = data

  const hashedPw = await bcrypt.hash(password, 12)
  const commercial = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPw,
      role: userRole,
      commercial: { create: commercialData },
    },
    include: { commercial: true },
  })

  return NextResponse.json(commercial, { status: 201 })
}
