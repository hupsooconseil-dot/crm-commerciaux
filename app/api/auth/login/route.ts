import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'
import { createSession } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        commercial: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      commercialId: user.commercial?.id,
      nom: user.commercial?.nom,
      prenom: user.commercial?.prenom,
    })

    return NextResponse.json({
      success: true,
      role: user.role,
      nom: user.commercial?.nom,
      prenom: user.commercial?.prenom,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
