'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatDate } from '@/app/lib/utils'

const TYPES = ['VISITE', 'TELEPHONE', 'EMAIL', 'VISIO']
const TYPE_ICONS: Record<string, string> = {
  VISITE: '🚗', TELEPHONE: '📞', EMAIL: '📧', VISIO: '💻'
}

export default function CRVPage() {
  const session = useSession()
  const [crvs, setCrvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [form, setForm] = useState({
    dateVisite: new Date().toISOString().slice(0, 16),
    typeContact: 'VISITE', duree: '60',
    objectif: '', compteRendu: '', actionsNext: '',
    dateRelance: '', kilometrage: '', qualite: '3'
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterType) params.set('type', filterType)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    fetch(`/api/crv?${params}`)
      .then(r => r.json())
      .then(d => { setCrvs(d); setLoading(false) })
  }

  useEffect(() => { load() }, [search, filterType, dateFrom, dateTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/crv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dateVisite: new Date(form.dateVisite).toISOString(),
        duree: parseInt(form.duree) || null,
        kilometrage: parseFloat(form.kilometrage) || null,
        qualite: parseInt(form.qualite) || 3,
        dateRelance: form.dateRelance ? new Date(form.dateRelance).toISOString() : null,
      }),
    })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteCrv(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer ce compte-rendu ?')) return
    await fetch(`/api/crv/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const totalKm = crvs.reduce((s, c) => s + (c.kilometrage || 0), 0)

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Comptes-Rendus de Visite</h1>
          <p className="text-sm text-gray-500">
            {crvs.length} CRV — {totalKm > 0 ? `${Math.round(totalKm)} km parcourus` : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nouveau CRV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {(search || filterType || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setDateFrom(''); setDateTo('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="space-y-3">
        {crvs.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
            Aucun compte-rendu de visite
          </div>
        ) : (
          crvs.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(c)}>
              <div className="flex items-start gap-3">
                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg flex-shrink-0">
                  {TYPE_ICONS[c.typeContact]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {c.prospect?.raisonSociale || 'Contact direct'}
                      </p>
                      {(session?.role !== 'COMMERCIAL') && (
                        <p className="text-xs text-blue-500">{c.commercial?.prenom} {c.commercial?.nom}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(c.dateVisite)}</p>
                      {c.duree && <p className="text-xs text-gray-400">{c.duree} min</p>}
                    </div>
                  </div>
                  {c.objectif && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Objectif :</span> {c.objectif}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{c.compteRendu}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {c.actionsNext && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Action : {c.actionsNext}
                      </span>
                    )}
                    {c.kilometrage && (
                      <span className="text-xs text-gray-400">🚗 {c.kilometrage} km</span>
                    )}
                    {c.qualite && (
                      <span className="text-xs text-yellow-500">{'★'.repeat(c.qualite)}{'☆'.repeat(5 - c.qualite)}</span>
                    )}
                    <button
                      onClick={e => deleteCrv(c.id, e)}
                      className="ml-auto text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">{TYPE_ICONS[selected.typeContact]} CRV - {formatDate(selected.dateVisite)}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {selected.prospect && (
                <div><span className="font-medium text-gray-700">Client :</span> {selected.prospect.raisonSociale}</div>
              )}
              <div><span className="font-medium text-gray-700">Type :</span> {selected.typeContact}</div>
              {selected.duree && <div><span className="font-medium text-gray-700">Durée :</span> {selected.duree} min</div>}
              {selected.objectif && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Objectif</p>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{selected.objectif}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-700 mb-1">Compte-rendu</p>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.compteRendu}</p>
              </div>
              {selected.actionsNext && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Actions à faire</p>
                  <p className="text-gray-600 bg-blue-50 rounded-lg p-3">{selected.actionsNext}</p>
                </div>
              )}
              {selected.dateRelance && (
                <div><span className="font-medium text-gray-700">Relance prévue :</span> {formatDate(selected.dateRelance)}</div>
              )}
              {selected.kilometrage && (
                <div><span className="font-medium text-gray-700">Kilométrage :</span> {selected.kilometrage} km</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Nouveau CRV</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date/heure *</label>
                  <input type="datetime-local" required value={form.dateVisite} onChange={e => setForm({...form, dateVisite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.typeContact} onChange={e => setForm({...form, typeContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Durée (min)</label>
                  <input type="number" value={form.duree} onChange={e => setForm({...form, duree: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {form.typeContact === 'VISITE' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kilométrage</label>
                    <input type="number" step="0.1" value={form.kilometrage} onChange={e => setForm({...form, kilometrage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objectif de la visite</label>
                <input value={form.objectif} onChange={e => setForm({...form, objectif: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Compte-rendu *</label>
                <textarea required value={form.compteRendu} onChange={e => setForm({...form, compteRendu: e.target.value})} rows={4}
                  placeholder="Résumé de la visite, points discutés, résultats..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Actions suivantes</label>
                <input value={form.actionsNext} onChange={e => setForm({...form, actionsNext: e.target.value})}
                  placeholder="Ex: Envoyer devis, Rappeler le 15..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date relance</label>
                  <input type="date" value={form.dateRelance} onChange={e => setForm({...form, dateRelance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qualité (1-5)</label>
                  <select value={form.qualite} onChange={e => setForm({...form, qualite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}
                  </select>
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
