'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatCurrency, statutColor } from '@/app/lib/utils'

const STATUTS = ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'LITIGE']
const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente', VALIDEE: 'Validée', PAYEE: 'Payée', LITIGE: 'Litige'
}

export default function CommissionsPage() {
  const session = useSession()
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    periode: new Date().toISOString().slice(0, 7),
    montantBase: '', taux: '5', notes: '', contratId: ''
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (filterStatut) params.set('statut', filterStatut)
    fetch(`/api/commissions?${params}`)
      .then(r => r.json())
      .then(d => { setCommissions(d); setLoading(false) })
  }

  useEffect(() => { load() }, [filterStatut])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        montantBase: parseFloat(form.montantBase) || 0,
        taux: parseFloat(form.taux) || 0,
      }),
    })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteCommission(id: string) {
    if (!confirm('Supprimer cette commission ?')) return
    await fetch(`/api/commissions/${id}`, { method: 'DELETE' })
    load()
  }

  async function updateStatut(id: string, statut: string) {
    const updates: any = { statut }
    if (statut === 'VALIDEE') updates.dateValidation = new Date().toISOString()
    if (statut === 'PAYEE') updates.datePaiement = new Date().toISOString()
    await fetch(`/api/commissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const totalEnAttente = commissions.filter(c => c.statut === 'EN_ATTENTE').reduce((s, c) => s + c.montantCommission, 0)
  const totalValide = commissions.filter(c => c.statut === 'VALIDEE').reduce((s, c) => s + c.montantCommission, 0)
  const totalPaye = commissions.filter(c => c.statut === 'PAYEE').reduce((s, c) => s + c.montantCommission, 0)

  // Group by period
  const byPeriode = commissions.reduce((acc, c) => {
    if (!acc[c.periode]) acc[c.periode] = []
    acc[c.periode].push(c)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Commissions</h1>
          <p className="text-sm text-gray-500">{commissions.length} ligne{commissions.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nouvelle commission
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-xs text-yellow-700 font-medium">En attente</p>
          <p className="text-xl font-bold text-yellow-800 mt-1">{formatCurrency(totalEnAttente)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-700 font-medium">Validées</p>
          <p className="text-xl font-bold text-blue-800 mt-1">{formatCurrency(totalValide)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-700 font-medium">Payées</p>
          <p className="text-xl font-bold text-green-800 mt-1">{formatCurrency(totalPaye)}</p>
        </div>
      </div>

      <div className="mb-4">
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {Object.entries(byPeriode)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([periode, items]) => {
            const total = (items as any[]).reduce((s: number, c: any) => s + c.montantCommission, 0)
            return (
              <div key={periode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{periode}</h3>
                  <span className="font-bold text-green-600">{formatCurrency(total)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-500 text-xs uppercase border-b border-gray-100">
                      <tr>
                        {session?.role !== 'COMMERCIAL' && <th className="px-4 py-2 text-left">Commercial</th>}
                        <th className="px-4 py-2 text-left">Contrat</th>
                        <th className="px-4 py-2 text-right">Base</th>
                        <th className="px-4 py-2 text-right">Taux</th>
                        <th className="px-4 py-2 text-right">Commission</th>
                        <th className="px-4 py-2 text-left">Statut</th>
                        {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
                          <th className="px-4 py-2 text-left">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(items as any[]).map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          {session?.role !== 'COMMERCIAL' && (
                            <td className="px-4 py-2 text-gray-700">{c.commercial?.prenom} {c.commercial?.nom}</td>
                          )}
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {c.contrat?.reference || '-'}
                            {c.contrat?.clientNom && <span className="block text-gray-400">{c.contrat.clientNom}</span>}
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(c.montantBase)}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{c.taux}%</td>
                          <td className="px-4 py-2 text-right font-semibold text-green-600">{formatCurrency(c.montantCommission)}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor(c.statut)}`}>
                              {STATUT_LABELS[c.statut]}
                            </span>
                          </td>
                          {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                {c.statut === 'EN_ATTENTE' && (
                                  <button onClick={() => updateStatut(c.id, 'VALIDEE')}
                                    className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                    Valider
                                  </button>
                                )}
                                {c.statut === 'VALIDEE' && (
                                  <button onClick={() => updateStatut(c.id, 'PAYEE')}
                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                    Marquer payée
                                  </button>
                                )}
                                <button onClick={() => deleteCommission(c.id)}
                                  className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
                                  ✕
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        {Object.keys(byPeriode).length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
            Aucune commission enregistrée
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Nouvelle commission</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Période (YYYY-MM)</label>
                <input type="month" required value={form.periode} onChange={e => setForm({...form, periode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Montant base (€)</label>
                  <input type="number" required value={form.montantBase} onChange={e => setForm({...form, montantBase: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Taux (%)</label>
                  <input type="number" step="0.5" required value={form.taux} onChange={e => setForm({...form, taux: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {form.montantBase && form.taux && (
                <div className="p-3 bg-green-50 rounded-lg text-sm">
                  Commission calculée : <strong className="text-green-600">
                    {formatCurrency(parseFloat(form.montantBase) * parseFloat(form.taux) / 100)}
                  </strong>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
