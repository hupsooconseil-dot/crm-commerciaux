import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role')
  const commercialId = req.headers.get('x-commercial-id')

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const where = role === 'COMMERCIAL' && commercialId
      ? { commercialId }
      : {}

    const [
      totalCommerciaux,
      commerciauxActifs,
      totalProspects,
      totalOpportunites,
      opportunitesEnCours,
      totalContrats,
      contratsActifs,
      totalCommissions,
      commissionsEnAttente,
      alertesNonLues,
      documentsExpires,
    ] = await Promise.all([
      prisma.commercial.count(),
      prisma.commercial.count({ where: { statut: 'ACTIF' } }),
      prisma.prospect.count({ where }),
      prisma.opportunite.count({ where }),
      prisma.opportunite.count({ where: { ...where, statut: 'EN_COURS' } }),
      prisma.contrat.count({ where }),
      prisma.contrat.count({ where: { ...where, statut: 'ACTIF' } }),
      prisma.commission.aggregate({ where, _sum: { montantCommission: true } }),
      prisma.commission.aggregate({
        where: { ...where, statut: 'EN_ATTENTE' },
        _sum: { montantCommission: true },
      }),
      prisma.alerte.count({ where: { estLue: false } }),
      prisma.document.count({ where: { ...where, statut: 'EXPIRE' } }),
    ])

    const pipelineCA = await prisma.opportunite.aggregate({
      where: { ...where, statut: 'EN_COURS' },
      _sum: { montantEstime: true },
    })

    const caTotal = await prisma.contrat.aggregate({
      where: { ...where, statut: 'ACTIF' },
      _sum: { montant: true },
    })

    const prospectsParStatut = await prisma.prospect.groupBy({
      by: ['statut'],
      where,
      _count: true,
    })

    const opportunitesParEtape = await prisma.opportunite.groupBy({
      by: ['etape'],
      where: { ...where, statut: 'EN_COURS' },
      _count: true,
      _sum: { montantEstime: true },
    })

    const commissionsParMois = await prisma.commission.groupBy({
      by: ['periode'],
      where: { ...where, statut: { in: ['PAYEE', 'VALIDEE'] } },
      _sum: { montantCommission: true },
      orderBy: { periode: 'desc' },
      take: 6,
    })

    const topCommerciaux = role !== 'COMMERCIAL' ? await prisma.commercial.findMany({
      where: { statut: 'ACTIF' },
      include: {
        contrats: { where: { statut: 'ACTIF' }, select: { montant: true } },
        opportunites: { where: { statut: 'EN_COURS' }, select: { montantEstime: true } },
        _count: { select: { prospects: true, crv: true } },
      },
      take: 10,
    }) : []

    return NextResponse.json({
      stats: {
        totalCommerciaux,
        commerciauxActifs,
        totalProspects,
        totalOpportunites,
        opportunitesEnCours,
        totalContrats,
        contratsActifs,
        totalCommissions: totalCommissions._sum.montantCommission || 0,
        commissionsEnAttente: commissionsEnAttente._sum.montantCommission || 0,
        alertesNonLues,
        documentsExpires,
        pipelineCA: pipelineCA._sum.montantEstime || 0,
        caTotal: caTotal._sum.montant || 0,
      },
      charts: {
        prospectsParStatut,
        opportunitesParEtape,
        commissionsParMois: commissionsParMois.reverse(),
      },
      topCommerciaux: topCommerciaux.map(c => ({
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        region: c.region,
        caRealise: c.contrats.reduce((sum, ct) => sum + ct.montant, 0),
        pipeline: c.opportunites.reduce((sum, o) => sum + o.montantEstime, 0),
        nbProspects: c._count.prospects,
        nbVisites: c._count.crv,
      })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
