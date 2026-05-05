'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/components/SessionContext'
import { formatCurrency, formatDate, statutColor } from '@/app/lib/utils'

const STATUTS_CONTRAT = ['ACTIF', 'EN_ATTENTE', 'EXPIRE', 'RESILIE']
const PRODUITS = [
  'Installation PV Résidentiel',
  'Installation PV Professionnel',
  'Batterie de stockage LFP',
  'Ombrière PV',
  'Borne IRVE',
  'Pompe à chaleur',
  'Ballon thermodynamique',
  'Autre',
]

export default function ContratsPage() {
  const session = useSession()
  const router = useRouter()
  const [contrats, setContrats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    clientNom: '', clientEmail: '', clientTelephone: '',
    produit: '', montant: '', tauxCommission: '5',
    statut: 'ACTIF', dateSignature: '', dateDebut: '', dateFin: ''
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStatut) params.set('statut', filterStatut)
    fetch(`/api/contrats?${params}`)
      .then(r => r.json())
      .then(d => { setContrats(d); setLoading(false) })
  }

  useEffect(() => { load() }, [search, filterStatut])

  async function deleteContrat(id: string) {
    if (!confirm('Supprimer ce contrat ?')) return
    await fetch(`/api/contrats/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/contrats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        montant: parseFloat(form.montant) || 0,
        tauxCommission: parseFloat(form.tauxCommission) || 0,
        dateSignature: form.dateSignature ? new Date(form.dateSignature).toISOString() : null,
        dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : null,
        dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : null,
      }),
    })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const caTotal = contrats.filter(c => c.statut === 'ACTIF').reduce((s, c) => s + c.montant, 0)

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contrats</h1>
          <p className="text-sm text-gray-500">
            {contrats.length} contrat{contrats.length !== 1 ? 's' : ''} — CA actif : <strong className="text-green-600">{formatCurrency(caTotal)}</strong>
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nouveau contrat
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les statuts</option>
          {STATUTS_CONTRAT.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Produit</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Commission</th>
                <th className="px-4 py-3 text-left">Statut</th>
                {(session?.role !== 'COMMERCIAL') && (
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Commercial</th>
                )}
                <th className="px-4 py-3 text-left hidden lg:table-cell">Signature</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contrats.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucun contrat</td></tr>
              ) : (
                contrats.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/contrats/${c.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{c.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.clientNom}</p>
                      {c.clientEmail && <p className="text-xs text-gray-400">{c.clientEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.produit || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(c.montant)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                      {c.tauxCommission}% = {formatCurrency(c.montant * c.tauxCommission / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor(c.statut)}`}>
                        {c.statut}
                      </span>
                    </td>
                    {session?.role !== 'COMMERCIAL' && (
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {c.commercial?.prenom} {c.commercial?.nom}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{formatDate(c.dateSignature)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteContrat(c.id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium">✕</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Nouveau contrat</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom client *</label>
                  <input required value={form.clientNom} onChange={e => setForm({...form, clientNom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email client</label>
                  <input type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                  <input value={form.clientTelephone} onChange={e => setForm({...form, clientTelephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Produit</label>
                  <select value={form.produit} onChange={e => setForm({...form, produit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">Sélectionner</option>
                    {PRODUITS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Montant (€)</label>
                  <input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Taux commission (%)</label>
                  <input type="number" step="0.5" value={form.tauxCommission} onChange={e => setForm({...form, tauxCommission: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date signature</label>
                  <input type="date" value={form.dateSignature} onChange={e => setForm({...form, dateSignature: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date début</label>
                  <input type="date" value={form.dateDebut} onChange={e => setForm({...form, dateDebut: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date fin</label>
                  <input type="date" value={form.dateFin} onChange={e => setForm({...form, dateFin: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Enregistrement...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
