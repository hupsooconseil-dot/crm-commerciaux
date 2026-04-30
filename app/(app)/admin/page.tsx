'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatDate, statutColor, getDaysUntil } from '@/app/lib/utils'

export default function AdminPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [docWarnings, setDocWarnings] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/documents?statut=EXPIRE').then(r => r.json()),
      fetch('/api/documents').then(r => r.json()),
    ]).then(([dash, expired, allDocs]) => {
      setData(dash)
      const expiringSoon = allDocs.filter((d: any) => {
        const days = getDaysUntil(d.dateExpiration)
        return days !== null && days >= 0 && days <= 30
      })
      setDocWarnings([...expired, ...expiringSoon].slice(0, 20))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const { stats } = data

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500">Vue globale de la plateforme</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Total commerciaux</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCommerciaux}</p>
          <p className="text-xs text-green-600 mt-1">{stats.commerciauxActifs} actifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">CA Contrats actifs</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.caTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.contratsActifs} contrats</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Pipeline</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pipelineCA)}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.opportunitesEnCours} opps</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Commissions dues</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.commissionsEnAttente)}</p>
          <p className="text-xs text-gray-400 mt-1">à valider/payer</p>
        </div>
      </div>

      {/* Points de vigilance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents à surveiller */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">⚠️ Documents à surveiller</h2>
            <p className="text-xs text-gray-500 mt-0.5">Expirés ou expirant dans 30 jours</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {docWarnings.length === 0 ? (
              <p className="p-5 text-sm text-green-600">✓ Tous les documents sont à jour</p>
            ) : (
              docWarnings.map(d => {
                const daysLeft = getDaysUntil(d.dateExpiration)
                return (
                  <div key={d.id} className="px-5 py-3 border-b border-gray-50 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.nom}</p>
                      <p className="text-xs text-gray-500">{d.commercial?.prenom} {d.commercial?.nom}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className={`text-xs font-medium ${daysLeft !== null && daysLeft < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {daysLeft !== null && daysLeft < 0
                          ? `Expiré (${Math.abs(daysLeft)}j)`
                          : daysLeft !== null ? `${daysLeft}j restants` : formatDate(d.dateExpiration)
                        }
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RSAC vérification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">📋 Points de conformité</h2>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium text-blue-900">Vérification RSAC</p>
                <p className="text-xs text-blue-600">Contrôler le statut actif/radié des agents</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="font-medium text-orange-900">RC Pro annuelle</p>
                <p className="text-xs text-orange-600">Vérifier les attestations RC Pro</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium text-purple-900">DAS2</p>
                <p className="text-xs text-purple-600">Honoraires &gt; 1 200€/an à déclarer</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-xl">🔒</span>
              <div>
                <p className="font-medium text-green-900">RGPD</p>
                <p className="text-xs text-green-600">Accès données clients limités au nécessaire</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <span className="text-xl">⚖️</span>
              <div>
                <p className="font-medium text-red-900">Requalification salariale</p>
                <p className="text-xs text-red-600">Éviter tout lien de subordination</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top / Bottom performers */}
      {data.topCommerciaux.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">🏆 Top 5 Commerciaux</h2>
            </div>
            <div className="p-4 space-y-2">
              {[...data.topCommerciaux]
                .sort((a: any, b: any) => b.caRealise - a.caRealise)
                .slice(0, 5)
                .map((c: any, i: number) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`font-bold text-sm w-6 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-400'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.prenom} {c.nom}</p>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.min(100, c.caRealise / 1000)}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(c.caRealise)}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">📉 À accompagner</h2>
            </div>
            <div className="p-4 space-y-2">
              {[...data.topCommerciaux]
                .sort((a: any, b: any) => a.caRealise - b.caRealise)
                .slice(0, 5)
                .map((c: any, i: number) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="font-medium text-sm w-6 text-gray-400">#{data.topCommerciaux.length - i}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.prenom} {c.nom}</p>
                      <p className="text-xs text-gray-400">{c.nbProspects} prospects · {c.nbVisites} CRV</p>
                    </div>
                    <span className="text-sm font-semibold text-orange-500">{formatCurrency(c.caRealise)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
