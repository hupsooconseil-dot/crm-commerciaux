'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatCurrency } from '@/app/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: string | number; sub?: string; icon: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const session = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement du tableau de bord...</div>
  if (!data) return null

  const { stats, charts, topCommerciaux } = data
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'MANAGER'

  const etapesLabels: Record<string, string> = {
    PROSPECTION: 'Prospection', RDV: 'RDV', DEVIS: 'Devis',
    NEGOCIATION: 'Négo.', CLOSING: 'Closing'
  }

  const pipelineData = charts.opportunitesParEtape.map((e: any) => ({
    name: etapesLabels[e.etape] || e.etape,
    count: e._count,
    montant: Math.round((e._sum?.montantEstime || 0) / 1000),
  }))

  const commissionsData = charts.commissionsParMois.map((c: any) => ({
    name: c.periode,
    montant: Math.round(c._sum?.montantCommission || 0),
  }))

  const prospectsPieData = charts.prospectsParStatut.map((p: any, i: number) => ({
    name: p.statut,
    value: p._count,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Bonjour, {session?.prenom || 'Utilisateur'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Voici un aperçu de votre activité commerciale
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <StatCard
            title="Commerciaux actifs"
            value={`${stats.commerciauxActifs}/${stats.totalCommerciaux}`}
            sub="agents sur le terrain"
            icon="👥"
            color="bg-blue-50"
          />
        )}
        <StatCard
          title="Pipeline CA"
          value={formatCurrency(stats.pipelineCA)}
          sub={`${stats.opportunitesEnCours} opportunités`}
          icon="📊"
          color="bg-purple-50"
        />
        <StatCard
          title="CA Contrats actifs"
          value={formatCurrency(stats.caTotal)}
          sub={`${stats.contratsActifs} contrats`}
          icon="📝"
          color="bg-green-50"
        />
        <StatCard
          title="Commissions dues"
          value={formatCurrency(stats.commissionsEnAttente)}
          sub="en attente de validation"
          icon="💰"
          color="bg-yellow-50"
        />
        <StatCard
          title="Prospects"
          value={stats.totalProspects}
          sub="dans votre portefeuille"
          icon="🎯"
          color="bg-orange-50"
        />
        {stats.documentsExpires > 0 && (
          <StatCard
            title="Documents expirés"
            value={stats.documentsExpires}
            sub="à renouveler"
            icon="⚠️"
            color="bg-red-50"
          />
        )}
        {stats.alertesNonLues > 0 && (
          <StatCard
            title="Alertes non lues"
            value={stats.alertesNonLues}
            icon="🔔"
            color="bg-red-50"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline par étape */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Pipeline par étape</h2>
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any, name: any) => [
                  name === 'montant' ? `${v}k€` : v,
                  name === 'montant' ? 'Montant (k€)' : 'Nb opps'
                ] as any} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Nb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Aucune opportunité en cours
            </div>
          )}
        </div>

        {/* Répartition prospects */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Statut des prospects</h2>
          {prospectsPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={prospectsPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {prospectsPieData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {prospectsPieData.map((entry: any) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="text-gray-600 truncate">{entry.name}</span>
                    <span className="font-semibold ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Aucun prospect
            </div>
          )}
        </div>
      </div>

      {/* Commissions par mois */}
      {commissionsData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Commissions versées (6 derniers mois)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={commissionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: any) => [formatCurrency(v), 'Commissions']} />
              <Line type="monotone" dataKey="montant" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top commerciaux (admin only) */}
      {isAdmin && topCommerciaux.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Top Commerciaux</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Rang</th>
                  <th className="px-5 py-3 text-left">Commercial</th>
                  <th className="px-5 py-3 text-left">Région</th>
                  <th className="px-5 py-3 text-right">CA Réalisé</th>
                  <th className="px-5 py-3 text-right">Pipeline</th>
                  <th className="px-5 py-3 text-right">Prospects</th>
                  <th className="px-5 py-3 text-right">Visites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topCommerciaux
                  .sort((a: any, b: any) => b.caRealise - a.caRealise)
                  .slice(0, 10)
                  .map((c: any, i: number) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {c.prenom} {c.nom}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{c.region || '-'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-600">
                        {formatCurrency(c.caRealise)}
                      </td>
                      <td className="px-5 py-3 text-right text-blue-600">
                        {formatCurrency(c.pipeline)}
                      </td>
                      <td className="px-5 py-3 text-right">{c.nbProspects}</td>
                      <td className="px-5 py-3 text-right">{c.nbVisites}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
