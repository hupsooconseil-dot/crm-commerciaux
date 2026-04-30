'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatCurrency, formatDate, statutColor } from '@/app/lib/utils'

const ETAPES = ['PROSPECTION', 'RDV', 'DEVIS', 'NEGOCIATION', 'CLOSING']
const ETAPE_LABELS: Record<string, string> = {
  PROSPECTION: 'Prospection', RDV: 'RDV', DEVIS: 'Devis', NEGOCIATION: 'Négociation', CLOSING: 'Closing'
}
const ETAPE_COLORS: Record<string, string> = {
  PROSPECTION: 'bg-gray-100 border-gray-300', RDV: 'bg-blue-50 border-blue-200',
  DEVIS: 'bg-yellow-50 border-yellow-200', NEGOCIATION: 'bg-orange-50 border-orange-200',
  CLOSING: 'bg-green-50 border-green-200'
}

export default function PipelinePage() {
  const session = useSession()
  const [opportunites, setOpportunites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titre: '', montantEstime: '', probabilite: '50', etape: 'PROSPECTION',
    description: '', datePrevClot: ''
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/opportunites?statut=EN_COURS')
      .then(r => r.json())
      .then(d => { setOpportunites(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/opportunites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        montantEstime: parseFloat(form.montantEstime) || 0,
        probabilite: parseInt(form.probabilite) || 50,
        datePrevClot: form.datePrevClot ? new Date(form.datePrevClot).toISOString() : null,
      }),
    })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function moveEtape(id: string, etape: string) {
    await fetch(`/api/opportunites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etape }),
    })
    load()
  }

  async function closeOpp(id: string, statut: 'GAGNE' | 'PERDU') {
    await fetch(`/api/opportunites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut, dateClot: new Date().toISOString() }),
    })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const totalPipeline = opportunites.reduce((sum, o) => sum + o.montantEstime, 0)
  const weightedPipeline = opportunites.reduce((sum, o) => sum + o.montantEstime * o.probabilite / 100, 0)

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pipeline Commercial</h1>
          <p className="text-sm text-gray-500">
            {opportunites.length} opportunité{opportunites.length !== 1 ? 's' : ''} —{' '}
            Pipeline brut : <strong>{formatCurrency(totalPipeline)}</strong> —{' '}
            Pipeline pondéré : <strong className="text-green-600">{formatCurrency(weightedPipeline)}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nouvelle opportunité
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {ETAPES.map(etape => {
          const opps = opportunites.filter(o => o.etape === etape)
          const total = opps.reduce((sum, o) => sum + o.montantEstime, 0)
          return (
            <div key={etape} className={`rounded-xl border-2 p-3 ${ETAPE_COLORS[etape]}`}>
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-700 uppercase">
                  {ETAPE_LABELS[etape]}
                </h3>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</p>
                <p className="text-xs text-gray-500">{opps.length} opp{opps.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-2">
                {opps.map(o => (
                  <div key={o.id} className="bg-white rounded-lg p-3 shadow-sm text-sm">
                    <p className="font-medium text-gray-900 truncate">{o.titre}</p>
                    <p className="text-green-600 font-semibold text-xs mt-1">
                      {formatCurrency(o.montantEstime)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${o.probabilite}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{o.probabilite}%</span>
                    </div>
                    {o.prospect && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{o.prospect.raisonSociale}</p>
                    )}
                    {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && o.commercial && (
                      <p className="text-xs text-blue-400 mt-1">{o.commercial.prenom} {o.commercial.nom}</p>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {etape !== 'CLOSING' && (
                        <button
                          onClick={() => moveEtape(o.id, ETAPES[ETAPES.indexOf(etape) + 1])}
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          →
                        </button>
                      )}
                      <button
                        onClick={() => closeOpp(o.id, 'GAGNE')}
                        className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        ✓ Gagné
                      </button>
                      <button
                        onClick={() => closeOpp(o.id, 'PERDU')}
                        className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        ✗ Perdu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Nouvelle opportunité</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
                <input required value={form.titre} onChange={e => setForm({...form, titre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Montant estimé (€)</label>
                  <input type="number" value={form.montantEstime} onChange={e => setForm({...form, montantEstime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Probabilité (%)</label>
                  <input type="number" min="0" max="100" value={form.probabilite} onChange={e => setForm({...form, probabilite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Étape</label>
                  <select value={form.etape} onChange={e => setForm({...form, etape: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    {ETAPES.map(e => <option key={e} value={e}>{ETAPE_LABELS[e]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date clôture prévue</label>
                  <input type="date" value={form.datePrevClot} onChange={e => setForm({...form, datePrevClot: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
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
