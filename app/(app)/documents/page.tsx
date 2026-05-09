'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatDate, statutColor, getDaysUntil } from '@/app/lib/utils'

const DOC_TYPES = [
  { value: 'RSAC', label: 'Extrait RSAC', icon: '📋' },
  { value: 'RC_PRO', label: 'RC Pro', icon: '🛡️' },
  { value: 'KBIS', label: 'Kbis / INSEE', icon: '🏢' },
  { value: 'RIB', label: 'RIB', icon: '🏦' },
  { value: 'CNI', label: "Pièce d'identité", icon: '🪪' },
  { value: 'CONTRAT_AGENT', label: "Contrat d'agent", icon: '📝' },
  { value: 'CONVENTION_CONFIDENTIALITE', label: 'Convention confidentialité', icon: '🤫' },
  { value: 'CHARTE', label: 'Charte commerciale', icon: '✍️' },
  { value: 'NON_CONCURRENCE', label: 'Non-concurrence', icon: '🚫' },
  { value: 'AUTRE', label: 'Autre', icon: '📄' },
]

export default function DocumentsPage() {
  const session = useSession()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'RSAC', nom: '', description: '', statut: 'VALIDE',
    dateDocument: '', dateExpiration: '', dateReception: new Date().toISOString().slice(0, 10)
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [fichierUrl, setFichierUrl] = useState('')

  const load = () => {
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    if (filterStatut) params.set('statut', filterStatut)
    fetch(`/api/documents?${params}`)
      .then(r => r.json())
      .then(d => { setDocuments(d); setLoading(false) })
  }

  useEffect(() => { load() }, [filterType, filterStatut])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setSaveError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      setFichierUrl(data.url)
    } else {
      setSaveError('Erreur upload : ' + (data.error || 'inconnu'))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        fichierUrl: fichierUrl || null,
        dateDocument: form.dateDocument ? new Date(form.dateDocument).toISOString() : null,
        dateExpiration: form.dateExpiration ? new Date(form.dateExpiration).toISOString() : null,
        dateReception: form.dateReception ? new Date(form.dateReception).toISOString() : null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setShowForm(false)
      setFichierUrl('')
      setSaveError('')
      load()
    } else {
      const d = await res.json()
      setSaveError('Erreur : ' + (d.error || 'impossible de sauvegarder'))
    }
  }

  async function updateStatut(id: string, statut: string) {
    await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    load()
  }

  async function deleteDoc(id: string) {
    if (!confirm('Supprimer ce document ?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const expires = documents.filter(d => d.statut === 'EXPIRE').length
  const expiringSoon = documents.filter(d => {
    const days = getDaysUntil(d.dateExpiration)
    return days !== null && days > 0 && days <= 30
  }).length

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documents Administratifs</h1>
          <p className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
            {expires > 0 && <span className="text-red-500 ml-2">⚠️ {expires} expiré{expires !== 1 ? 's' : ''}</span>}
            {expiringSoon > 0 && <span className="text-orange-500 ml-2">⏰ {expiringSoon} expire bientôt</span>}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Ajouter document
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Tous les types</option>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Tous les statuts</option>
          <option value="VALIDE">Valide</option>
          <option value="EXPIRE">Expiré</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="MANQUANT">Manquant</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Document</th>
                {(session?.role !== 'COMMERCIAL') && (
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Commercial</th>
                )}
                <th className="px-4 py-3 text-left hidden md:table-cell">Reçu le</th>
                <th className="px-4 py-3 text-left">Expiration</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucun document</td></tr>
              ) : (
                documents.map(d => {
                  const daysLeft = getDaysUntil(d.dateExpiration)
                  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30
                  const typeInfo = DOC_TYPES.find(t => t.value === d.type)
                  return (
                    <tr key={d.id} className={`hover:bg-gray-50 ${d.statut === 'EXPIRE' ? 'bg-red-50' : isExpiringSoon ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="text-xl">{typeInfo?.icon}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{typeInfo?.label}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{d.nom}</p>
                        {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
                      </td>
                      {session?.role !== 'COMMERCIAL' && (
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                          {d.commercial?.prenom} {d.commercial?.nom}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDate(d.dateReception)}</td>
                      <td className="px-4 py-3">
                        {d.dateExpiration ? (
                          <>
                            <p className={`text-sm ${d.statut === 'EXPIRE' ? 'text-red-600 font-semibold' : isExpiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                              {formatDate(d.dateExpiration)}
                            </p>
                            {daysLeft !== null && (
                              <p className="text-xs mt-0.5 text-gray-400">
                                {daysLeft < 0 ? `Expiré il y a ${Math.abs(daysLeft)}j` : `Dans ${daysLeft}j`}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor(d.statut)}`}>
                          {d.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {d.fichierUrl && (
                            <a href={d.fichierUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-medium whitespace-nowrap">
                              📄 Ouvrir
                            </a>
                          )}
                          {(session?.role === 'ADMIN' || session?.role === 'MANAGER') && (
                            <select
                              value={d.statut}
                              onChange={e => updateStatut(d.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                            >
                              <option value="VALIDE">Valide</option>
                              <option value="EN_ATTENTE">En attente</option>
                              <option value="EXPIRE">Expiré</option>
                              <option value="MANQUANT">Manquant</option>
                            </select>
                          )}
                          <button
                            onClick={() => deleteDoc(d.id)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Ajouter un document</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de document</label>
                <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom du document *</label>
                <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date du document</label>
                  <input type="date" value={form.dateDocument} onChange={e => setForm({...form, dateDocument: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <input type="date" value={form.dateExpiration} onChange={e => setForm({...form, dateExpiration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fichier (PDF, image...)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange} disabled={uploading}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100" />
                {uploading && <p className="text-xs text-blue-500 mt-1">Envoi en cours...</p>}
                {fichierUrl && <p className="text-xs text-green-600 mt-1">✓ Fichier chargé avec succès</p>}
              </div>
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">⚠ {saveError}</div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setFichierUrl(''); setSaveError('') }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving || uploading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
