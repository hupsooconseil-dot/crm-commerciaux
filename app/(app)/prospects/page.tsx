'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatDate, statutColor } from '@/app/lib/utils'

const STATUTS = ['NOUVEAU', 'CONTACTE', 'RDV_PRIS', 'DEVIS_ENVOYE', 'NEGOCIA', 'GAGNE', 'PERDU']
const STATUT_LABELS: Record<string, string> = {
  NOUVEAU: 'Nouveau', CONTACTE: 'Contacté', RDV_PRIS: 'RDV pris',
  DEVIS_ENVOYE: 'Devis envoyé', NEGOCIA: 'Négociation', GAGNE: 'Gagné', PERDU: 'Perdu'
}

export default function ProspectsPage() {
  const session = useSession()
  const [prospects, setProspects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    raisonSociale: '', contactNom: '', contactPrenom: '', email: '',
    telephone: '', statut: 'NOUVEAU', source: '', notes: '',
    adresse: '', codePostal: '', ville: '', secteurActivite: ''
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStatut) params.set('statut', filterStatut)
    fetch(`/api/prospects?${params}`)
      .then(r => r.json())
      .then(d => { setProspects(d); setLoading(false) })
  }

  useEffect(() => { load() }, [search, filterStatut])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ raisonSociale: '', contactNom: '', contactPrenom: '', email: '', telephone: '', statut: 'NOUVEAU', source: '', notes: '', adresse: '', codePostal: '', ville: '', secteurActivite: '' })
    setSaving(false)
    load()
  }

  async function updateStatut(id: string, statut: string) {
    await fetch(`/api/prospects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    load()
  }

  async function deleteProspect(id: string) {
    if (!confirm('Supprimer ce prospect ? Cette action supprimera aussi ses CRV associés.')) return
    await fetch(`/api/prospects/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prospects</h1>
          <p className="text-sm text-gray-500">{prospects.length} prospect{prospects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nouveau prospect
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => (
            <option key={s} value={s}>{STATUT_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Kanban view */}
      <div className="hidden md:grid grid-cols-4 gap-4 mb-6">
        {['NOUVEAU', 'CONTACTE', 'RDV_PRIS', 'DEVIS_ENVOYE'].map(statut => (
          <div key={statut} className="bg-gray-50 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              {STATUT_LABELS[statut]} ({prospects.filter(p => p.statut === statut).length})
            </h3>
            <div className="space-y-2">
              {prospects
                .filter(p => p.statut === statut)
                .slice(0, 5)
                .map(p => (
                  <div key={p.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-sm">
                    <p className="font-medium text-gray-900 truncate">{p.raisonSociale}</p>
                    {p.contactNom && <p className="text-gray-500 text-xs mt-1">{p.contactPrenom} {p.contactNom}</p>}
                    <p className="text-gray-400 text-xs mt-1">{formatDate(p.createdAt)}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Société</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Source</th>
                <th className="px-4 py-3 text-left">Statut</th>
                {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Commercial</th>
                )}
                <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Aucun prospect trouvé
                  </td>
                </tr>
              ) : (
                prospects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.raisonSociale}</p>
                      {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.contactPrenom} {p.contactNom}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.source || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.statut}
                        onChange={e => updateStatut(p.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statutColor(p.statut)}`}
                      >
                        {STATUTS.map(s => (
                          <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {p.commercial?.prenom} {p.commercial?.nom}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={`/prospects/${p.id}`} className="text-xs text-blue-600 hover:underline">{p._count?.crv || 0} CRV</a>
                        <button
                          onClick={() => deleteProspect(p.id)}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Nouveau prospect</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Raison sociale *</label>
                  <input required value={form.raisonSociale} onChange={e => setForm({...form, raisonSociale: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom contact</label>
                  <input value={form.contactPrenom} onChange={e => setForm({...form, contactPrenom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom contact</label>
                  <input value={form.contactNom} onChange={e => setForm({...form, contactNom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Sélectionner</option>
                    <option>Prospection téléphonique</option>
                    <option>Recommandation</option>
                    <option>Salon / Événement</option>
                    <option>Site web</option>
                    <option>Réseau social</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Secteur d'activité</label>
                  <input value={form.secteurActivite} onChange={e => setForm({...form, secteurActivite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                  <input value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})}
                    placeholder="N° et nom de rue"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code postal</label>
                  <input value={form.codePostal} onChange={e => setForm({...form, codePostal: e.target.value})}
                    placeholder="75001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
                  <input value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
                    placeholder="Paris"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
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
