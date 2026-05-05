'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatCurrency, statutColor } from '@/app/lib/utils'

const DOC_TYPES = [
  { value: 'DEVIS', label: 'Devis signé', icon: '📋' },
  { value: 'CONTRAT', label: 'Contrat', icon: '📝' },
  { value: 'PHOTO_INSTALLATION', label: 'Photo installation', icon: '🏠' },
  { value: 'PHOTO_CHANTIER', label: 'Photo chantier', icon: '🏗️' },
  { value: 'FACTURE', label: 'Facture', icon: '💡' },
  { value: 'ATTESTATION', label: 'Attestation', icon: '🎫' },
  { value: 'CNI', label: "Pièce d'identité", icon: '🪪' },
  { value: 'AUTRE', label: 'Autre', icon: '📄' },
]

export default function ContratDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [contrat, setContrat] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [docForm, setDocForm] = useState({ type: 'DEVIS', nom: '', description: '' })
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadDocs = () =>
    fetch(`/api/contrat-docs?contratId=${id}`).then(r => r.json()).then(setDocs)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/contrats/${id}`).then(r => r.json()),
      fetch(`/api/contrat-docs?contratId=${id}`).then(r => r.json()),
    ]).then(([c, d]) => {
      setContrat(c)
      setDocs(d)
      setLoading(false)
    })
  }, [id])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    setDocForm(f => ({ ...f, nom: f.nom || file.name }))
  }

  async function saveDocument() {
    if (!docForm.nom) return
    setSaving(true)
    await fetch('/api/contrat-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contratId: id,
        type: docForm.type,
        nom: docForm.nom,
        description: docForm.description,
        fichierUrl: preview,
      }),
    })
    setShowAddDoc(false)
    setPreview(null)
    setDocForm({ type: 'DEVIS', nom: '', description: '' })
    setSaving(false)
    loadDocs()
  }

  async function deleteDoc(docId: string) {
    if (!confirm('Supprimer ce document ?')) return
    await fetch(`/api/contrat-docs/${docId}`, { method: 'DELETE' })
    setDocs(d => d.filter(x => x.id !== docId))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!contrat || contrat.error) return (
    <div className="p-6 text-center text-gray-500">Contrat introuvable</div>
  )

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 font-mono">{contrat.reference}</h1>
          <p className="text-xs text-gray-500">Détail du contrat</p>
        </div>
      </div>

      {/* Info contrat */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Informations contrat</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 w-28 flex-shrink-0">Client</span>
            <span className="font-semibold text-gray-900">{contrat.clientNom}</span>
          </div>
          {contrat.clientEmail && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Email</span>
              <a href={`mailto:${contrat.clientEmail}`} className="text-blue-600 truncate">{contrat.clientEmail}</a>
            </div>
          )}
          {contrat.clientTelephone && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Téléphone</span>
              <a href={`tel:${contrat.clientTelephone}`} className="text-blue-600">{contrat.clientTelephone}</a>
            </div>
          )}
          {contrat.produit && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Produit</span>
              <span className="text-gray-700">{contrat.produit}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-gray-400 w-28 flex-shrink-0">Montant</span>
            <span className="font-semibold text-green-600">{formatCurrency(contrat.montant)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-28 flex-shrink-0">Commission</span>
            <span className="text-gray-700">{contrat.tauxCommission}% = {formatCurrency(contrat.montant * contrat.tauxCommission / 100)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-28 flex-shrink-0">Statut</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor(contrat.statut)}`}>{contrat.statut}</span>
          </div>
          {contrat.dateSignature && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Signature</span>
              <span className="text-gray-700">{formatDate(contrat.dateSignature)}</span>
            </div>
          )}
          {contrat.commercial && (
            <div className="flex gap-2">
              <span className="text-gray-400 w-28 flex-shrink-0">Commercial</span>
              <span className="text-gray-700">{contrat.commercial.prenom} {contrat.commercial.nom}</span>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Documents & Photos ({docs.length})
        </h2>
        <button
          onClick={() => setShowAddDoc(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-400 text-sm">Aucun document pour ce contrat</p>
          <button
            onClick={() => setShowAddDoc(true)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Ajouter le premier document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const typeInfo = DOC_TYPES.find(t => t.value === doc.type)
            const isImage = doc.fichierUrl?.startsWith('data:image') || doc.fichierUrl?.match(/\.(jpg|jpeg|png|gif|webp)/i)
            return (
              <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isImage && doc.fichierUrl && (
                  <img src={doc.fichierUrl} alt={doc.nom} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeInfo?.icon || '📄'}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{doc.nom}</p>
                        <p className="text-xs text-gray-400">{typeInfo?.label || doc.type} · {formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  {doc.description && <p className="text-xs text-gray-500 mt-2">{doc.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add doc bottom sheet */}
      {showAddDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-gray-900 mb-4">Ajouter un document</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setDocForm(f => ({ ...f, type: t.value, nom: f.nom || t.label }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-left transition-colors ${
                        docForm.type === t.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-xs leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera / File */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Photo ou fichier</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.accept = 'image/*'
                        fileRef.current.setAttribute('capture', 'environment')
                        fileRef.current.click()
                      }
                    }}
                    className="py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    📷 Prendre une photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.accept = '*/*'
                        fileRef.current.removeAttribute('capture')
                        fileRef.current.click()
                      }
                    }}
                    className="py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    📁 Choisir un fichier
                  </button>
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                {preview && (
                  <div className="mt-2 relative">
                    <img src={preview} alt="Aperçu" className="w-full h-48 object-cover rounded-xl" />
                    <button onClick={() => setPreview(null)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full text-xs">✕</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom *</label>
                <input
                  value={docForm.nom}
                  onChange={e => setDocForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Devis signé 15/04"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Note (optionnel)</label>
                <textarea
                  value={docForm.description}
                  onChange={e => setDocForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Remarques..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddDoc(false); setPreview(null) }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveDocument}
                  disabled={saving || !docForm.nom}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {saving ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
