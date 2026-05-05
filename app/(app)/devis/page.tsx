'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/app/components/SessionContext'
import { formatCurrency, formatDate, statutColor } from '@/app/lib/utils'

const STATUTS = ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE']
const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon', ENVOYE: 'Envoyé', ACCEPTE: 'Accepté', REFUSE: 'Refusé', EXPIRE: 'Expiré'
}

export default function DevisPage() {
  const session = useSession()
  const router = useRouter()
  const [devis, setDevis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (filterStatut) p.set('statut', filterStatut)
    fetch(`/api/devis?${p}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setDevis(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { load() }, [search, filterStatut])

  async function deleteDevis(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer ce devis ?')) return
    await fetch(`/api/devis/${id}`, { method: 'DELETE' })
    load()
  }

  const totalAcceptes = devis.filter(d => d.statut === 'ACCEPTE').reduce((s, d) => s + d.montantTTC, 0)
  const totalEnvoyes = devis.filter(d => d.statut === 'ENVOYE').length

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 font-medium mb-2">Erreur de chargement</p>
      <p className="text-gray-400 text-sm mb-4">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Réessayer</button>
    </div>
  )

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Devis</h1>
          <p className="text-sm text-gray-500">
            {devis.length} devis · {totalEnvoyes} en attente · CA accepté : <strong className="text-green-600">{formatCurrency(totalAcceptes)}</strong>
          </p>
        </div>
        <Link href="/devis/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nouveau devis
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {STATUTS.map(s => {
          const count = devis.filter(d => d.statut === s).length
          const colors: Record<string, string> = {
            BROUILLON: 'bg-gray-50 border-gray-100 text-gray-700',
            ENVOYE: 'bg-blue-50 border-blue-100 text-blue-700',
            ACCEPTE: 'bg-green-50 border-green-100 text-green-700',
            REFUSE: 'bg-red-50 border-red-100 text-red-700',
            EXPIRE: 'bg-yellow-50 border-yellow-100 text-yellow-700',
          }
          return (
            <div key={s} className={`border rounded-xl p-3 text-center cursor-pointer ${colors[s]} ${filterStatut === s ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
              onClick={() => setFilterStatut(filterStatut === s ? '' : s)}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs">{STATUT_LABELS[s]}</p>
            </div>
          )
        })}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input type="text" placeholder="Rechercher client, référence..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-right">Montant TTC</th>
                <th className="px-4 py-3 text-left">Statut</th>
                {session?.role !== 'COMMERCIAL' && (
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Commercial</th>
                )}
                <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Validité</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {devis.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <div className="text-3xl mb-2">📋</div>
                  <p>Aucun devis</p>
                  <Link href="/devis/nouveau" className="inline-flex mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Créer le premier devis
                  </Link>
                </td></tr>
              ) : devis.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/devis/${d.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{d.reference}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{d.clientNom}</p>
                    {d.clientVille && <p className="text-xs text-gray-400">{d.clientVille}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                    {d.typeClient === 'PARTICULIER' ? '🏠 Particulier' : '🏢 Professionnel'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(d.montantTTC)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor(d.statut)}`}>
                      {STATUT_LABELS[d.statut]}
                    </span>
                  </td>
                  {session?.role !== 'COMMERCIAL' && (
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                      {d.commercial?.prenom} {d.commercial?.nom}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(d.dateDevis)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(d.dateValidite)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Link href={`/devis/${d.id}`}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Voir
                      </Link>
                      <button onClick={e => deleteDevis(d.id, e)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
