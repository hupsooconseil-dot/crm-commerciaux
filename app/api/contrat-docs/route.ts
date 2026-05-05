import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const contratId = searchParams.get('contratId')
  if (!contratId) return NextResponse.json([])
  const docs = await prisma.contratDocument.findMany({
    where: { contratId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const doc = await prisma.contratDocument.create({ data })
  return NextResponse.json(doc, { status: 201 })
}
