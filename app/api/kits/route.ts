import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const kits = await prisma.kit.findMany({
    where: { actif: true },
    orderBy: [{ categorie: 'asc' }, { prixHT: 'asc' }],
  })
  return NextResponse.json(kits)
}
