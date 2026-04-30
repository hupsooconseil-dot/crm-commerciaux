'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatCurrency, formatDate } from '@/app/lib/utils'

const STATUTS = ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE']

const statutColor: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  VALIDEE: 'bg-blue-100 text-blue-800',
  PAYEE: 'bg-green-100 text-green-800',
  REJETEE: 'bg-red-100 text-red-800',
}

const statutLabel: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  REJETEE: 'Rejetée',
}

export default function FacturesPage() {
  const session = useSession()
  const [factures, setFactures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    numero: '',
    montantHT: '',
    tva: '20',
    periode: '',
    dateFacture: '',
    notes: '',
  })

  const isAdmin = session?.role === 'ADMIN' || session?.role === 'MANAGER'

  const load = () => {
    fetch('/api/factures')
      .then(r => r.json())
      .then(d => { setFactures(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        montantHT: parseFloat(form.montantHT) || 0,
        tva: parseFloat(form.tva) || 20,
        dateFacture: form.dateFacture ? new Date(form.dateFacture).toISOString() : null,
      }),
    })
    setShowForm(false)
    setSaving(false)
    setForm({ numero: '', montantHT: '', tva: '20', periode: '', dateFacture: '', notes: '' })
    load()
  }

  async function updateStatut(id: string, statut: string) {
    await fetch(`/api/factures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    load()
  }

  const totalEnAttente = factures
    .filter(f => f.statut === 'EN_ATTENTE')
    .reduce((s, f) => s + f.montantTTC, 0)

  const totalPayee = factures
    .filter(f => f.statut === 'PAYEE')
    .reduce((s, f) => s + f.montantTTC, 0)

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Factures de commission</h1>
          <p className="text-sm text-gray-500">
            {isAdmin
              ? `${factures.length} facture${factures.length !== 1 ? 's' : ''} soumises`
              : 'Soumettez vos factures pour le règlement de vos commissions'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Nouvelle facture
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">En attente</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{formatCurrency(totalEnAttente)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {factures.filter(f => f.statut === 'EN_ATTENTE').length} facture(s)
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Réglées</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalPayee)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {factures.filter(f => f.statut === 'PAYEE').length} facture(s)
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Total soumis</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{factures.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">toutes périodes</p>
        </div>
      </div>

      {/* Guide pour le commercial */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">Comment ça marche ?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Créez votre facture avec le numéro, le montant HT et la période concernée</li>
            <li>Notre équipe valide votre facture sous 3 jours ouvrés</li>
            <li>Le règlement intervient dans les 10 jours après validation</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            Numéro de facture : utilisez le format <strong>FAC-AAAAMM-XXX</strong> (ex: FAC-202504-001)
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">N° Facture</th>
                {isAdmin && <th className="px-4 py-3 text-left hidden md:table-cell">Commercial</th>}
                <th className="px-4 py-3 text-left hidden md:table-cell">Période</th>
                <th className="px-4 py-3 text-right">Montant HT</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">TVA</th>
                <th className="px-4 py-3 text-right">Montant TTC</th>
                <th className="px-4 py-3 text-left">Statut</th>
                {isAdmin && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {factures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-3xl mb-2">🧾</div>
                    <p>Aucune facture soumise</p>
                    {!isAdmin && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Soumettre ma première facture
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                factures.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                      {f.numero}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                        {f.commercial?.prenom} {f.commercial?.nom}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {f.periode || formatDate(f.dateFacture) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {formatCurrency(f.montantHT)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">
                      {f.tva}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {formatCurrency(f.montantTTC)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor[f.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {statutLabel[f.statut] || f.statut}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {f.statut === 'EN_ATTENTE' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatut(f.id, 'VALIDEE')}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => updateStatut(f.id, 'REJETEE')}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
                            >
                              Rejeter
                            </button>
                          </div>
                        )}
                        {f.statut === 'VALIDEE' && (
                          <button
                            onClick={() => updateStatut(f.id, 'PAYEE')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium hover:bg-green-200"
                          >
                            Marquer payée
                          </button>
                        )}
                        {(f.statut === 'PAYEE' || f.statut === 'REJETEE') && (
                          <span className="text-xs text-gray-400">
                            {formatDate(f.dateTraitement)}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Soumettre une facture</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  N° de facture <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  placeholder="Ex: FAC-202504-001"
                  value={form.numero}
                  onChange={e => setForm({ ...form, numero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Montant HT (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.montantHT}
                    onChange={e => setForm({ ...form, montantHT: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">TVA (%)</label>
                  <select
                    value={form.tva}
                    onChange={e => setForm({ ...form, tva: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">0% (auto-liquidation)</option>
                    <option value="20">20%</option>
                  </select>
                </div>
              </div>

              {form.montantHT && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-green-700 font-medium">
                    Montant TTC : {formatCurrency(parseFloat(form.montantHT || '0') * (1 + parseFloat(form.tva || '20') / 100))}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Période (ex: 2025-04)</label>
                  <input
                    placeholder="AAAA-MM"
                    value={form.periode}
                    onChange={e => setForm({ ...form, periode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de facture</label>
                  <input
                    type="date"
                    value={form.dateFacture}
                    onChange={e => setForm({ ...form, dateFacture: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea
                  rows={3}
                  placeholder="Détail des commissions, références contrats..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving ? 'Envoi...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
