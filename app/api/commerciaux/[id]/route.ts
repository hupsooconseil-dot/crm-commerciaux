import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')

  if (role === 'COMMERCIAL' && commercialId !== id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const commercial = await prisma.commercial.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true } },
      documents: { orderBy: { type: 'asc' } },
      commissions: { orderBy: { periode: 'desc' }, take: 12 },
      formations: { include: { formation: true }, orderBy: { createdAt: 'desc' } },
      _count: { select: { prospects: true, opportunites: true, contrats: true, crv: true } },
    },
  })

  if (!commercial) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
  return NextResponse.json(commercial)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role')
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()
  const { email, userRole, ...commercialData } = data

  const commercial = await prisma.commercial.update({
    where: { id },
    data: commercialData,
  })

  if (email) {
    await prisma.user.update({
      where: { id: commercial.userId },
      data: { email: email.toLowerCase(), ...(userRole ? { role: userRole } : {}) },
    })
  }

  return NextResponse.json(commercial)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const role = req.headers.get('x-user-role')
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const commercial = await prisma.commercial.findUnique({ where: { id } })
  if (!commercial) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  await prisma.user.delete({ where: { id: commercial.userId } })
  return NextResponse.json({ success: true })
}
