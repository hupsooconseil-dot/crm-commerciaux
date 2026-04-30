import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const docs = await prisma.documentLibrairie.findMany({
    where: { estPublic: true },
    orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
  })
  return NextResponse.json(docs)
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  const userId = request.headers.get('x-user-id')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  const body = await request.json()
  const doc = await prisma.documentLibrairie.create({
    data: { ...body, uploadePar: userId },
  })
  return NextResponse.json(doc, { status: 201 })
}
