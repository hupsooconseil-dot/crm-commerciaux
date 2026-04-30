'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatDate } from '@/app/lib/utils'

const CATEGORIES = [
  { value: 'GENERAL', label: 'Général', icon: '📁' },
  { value: 'TECHNIQUE', label: 'Technique', icon: '⚡' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: '🎯' },
  { value: 'JURIDIQUE', label: 'Juridique', icon: '⚖️' },
  { value: 'FORMATION', label: 'Formation', icon: '🎓' },
  { value: 'TARIFICATION', label: 'Tarification', icon: '💰' },
]

export default function BibliothequeePage() {
  const session = useSession()
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom: '', description: '', categorie: 'GENERAL', fichierUrl: '', taille: '', mimeType: ''
  })

  const isAdmin = session?.role === 'ADMIN' || session?.role === 'MANAGER'

  const load = () => {
    fetch('/api/bibliotheque')
      .then(r => r.json())
      .then(d => { setDocs(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/bibliotheque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setSaving(false)
    setForm({ nom: '', description: '', categorie: 'GENERAL', fichierUrl: '', taille: '', mimeType: '' })
    load()
  }

  async function deleteDoc(id: string) {
    if (!confirm('Supprimer ce document de la bibliothèque ?')) return
    await fetch(`/api/bibliotheque/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = docs.filter(d => {
    const matchCat = !filterCat || d.categorie === filterCat
    const matchSearch = !search || d.nom.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const byCategorie = CATEGORIES.map(cat => ({
    ...cat,
    docs: filtered.filter(d => d.categorie === cat.value),
  })).filter(cat => cat.docs.length > 0 || !filterCat)

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bibliothèque de documents</h1>
          <p className="text-sm text-gray-500">
            {docs.length} document{docs.length !== 1 ? 's' : ''} partagés avec tous les commerciaux
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Ajouter un document
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filterCat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tous
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value === filterCat ? '' : c.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCat === c.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-gray-400 mb-2">Aucun document disponible</p>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Ajouter le premier document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filterCat ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(d => <DocCard key={d.id} doc={d} isAdmin={isAdmin} onDelete={deleteDoc} />)}
            </div>
          ) : (
            byCategorie.filter(c => c.docs.length > 0).map(cat => (
              <div key={cat.value}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {cat.icon} {cat.label} ({cat.docs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.docs.map(d => <DocCard key={d.id} doc={d} isAdmin={isAdmin} onDelete={deleteDoc} />)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Ajouter un document</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom du document *</label>
                <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL du fichier</label>
                <input value={form.fichierUrl} onChange={e => setForm({ ...form, fichierUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Taille</label>
                  <input value={form.taille} onChange={e => setForm({ ...form, taille: e.target.value })}
                    placeholder="Ex: 2.4 MB"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.mimeType} onChange={e => setForm({ ...form, mimeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Autre</option>
                    <option value="application/pdf">PDF</option>
                    <option value="application/vnd.ms-powerpoint">PowerPoint</option>
                    <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
                    <option value="application/vnd.ms-excel">Excel</option>
                    <option value="video/mp4">Vidéo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={saving}
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

function DocCard({ doc, isAdmin, onDelete }: { doc: any; isAdmin: boolean; onDelete: (id: string) => void }) {
  const typeIcon: Record<string, string> = {
    'application/pdf': '📄',
    'application/vnd.ms-powerpoint': '📊',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📈',
    'video/mp4': '🎬',
  }
  const icon = typeIcon[doc.mimeType] || '📁'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{doc.nom}</p>
          {doc.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {doc.taille && <span className="text-xs text-gray-400">{doc.taille}</span>}
            <span className="text-xs text-gray-300">{formatDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {doc.fichierUrl ? (
          <a
            href={doc.fichierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 text-center text-xs bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100"
          >
            Télécharger
          </a>
        ) : (
          <span className="flex-1 py-1.5 text-center text-xs bg-gray-50 text-gray-400 rounded-lg">
            Pas de fichier
          </span>
        )}
        {isAdmin && (
          <button
            onClick={() => onDelete(doc.id)}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
