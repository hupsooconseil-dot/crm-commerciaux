'use client'

import { useEffect, useState } from 'react'
import { formatDate, statutColor, getDaysUntil, getInitials } from '@/app/lib/utils'

export default function AdminCommerciauxPage() {
  const [commerciaux, setCommerciaux] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', password: '',
    role: 'COMMERCIAL', telephone: '', region: '', secteur: '',
    objectifMensuel: '', objectifAnnuel: '', numeroRSAC: ''
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStatut) params.set('statut', filterStatut)
    if (filterRegion) params.set('region', filterRegion)
    fetch(`/api/commerciaux?${params}`)
      .then(r => r.json())
      .then(d => { setCommerciaux(d); setLoading(false) })
  }

  const loadDetail = (c: any) => {
    fetch(`/api/commerciaux/${c.id}`)
      .then(r => r.json())
      .then(d => setSelected(d))
  }

  useEffect(() => { load() }, [search, filterStatut, filterRegion])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/commerciaux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        objectifMensuel: parseFloat(form.objectifMensuel) || 0,
        objectifAnnuel: parseFloat(form.objectifAnnuel) || 0,
      }),
    })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const regions = [...new Set(commerciaux.map(c => c.region).filter(Boolean))]

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestion des Commerciaux</h1>
          <p className="text-sm text-gray-500">{commerciaux.length} agent{commerciaux.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Ajouter commercial
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Tous</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
          <option value="OFFBOARDE">Offboardé</option>
        </select>
        {regions.length > 0 && (
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">Toutes régions</option>
            {regions.map(r => <option key={r as string} value={r as string}>{r as string}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {commerciaux.map(c => {
          const rsacDays = getDaysUntil(c.dateValiditeRSAC)
          const rcDays = getDaysUntil(c.dateValiditeRCPro)
          const hasWarning = (rsacDays !== null && rsacDays < 30) || (rcDays !== null && rcDays < 30)

          return (
            <div key={c.id}
              className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${hasWarning ? 'border-orange-200' : 'border-gray-100'}`}
              onClick={() => loadDetail(c)}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  c.statut === 'ACTIF' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {getInitials(c.nom, c.prenom)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{c.prenom} {c.nom}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${statutColor(c.statut)}`}>
                      {c.statut}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{c.user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.region} {c.secteur && `— ${c.secteur}`}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-gray-900">{c._count?.prospects}</p>
                  <p className="text-xs text-gray-400">Prospects</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-blue-600">{c._count?.opportunites}</p>
                  <p className="text-xs text-gray-400">Opps</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{c._count?.contrats}</p>
                  <p className="text-xs text-gray-400">Contrats</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-gray-700">{c._count?.crv}</p>
                  <p className="text-xs text-gray-400">CRV</p>
                </div>
              </div>

              {hasWarning && (
                <div className="mt-3 p-2 bg-orange-50 rounded-lg text-xs text-orange-700">
                  ⚠️ {rsacDays !== null && rsacDays < 30 ? `RSAC expire dans ${rsacDays}j` : ''}
                  {rcDays !== null && rcDays < 30 ? ` RC Pro expire dans ${rcDays}j` : ''}
                </div>
              )}

              {c.numeroRSAC && (
                <p className="text-xs text-gray-400 mt-2">RSAC : {c.numeroRSAC}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {getInitials(selected.nom, selected.prenom)}
                </div>
                <div>
                  <h2 className="font-bold">{selected.prenom} {selected.nom}</h2>
                  <p className="text-sm text-gray-400">{selected.user?.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400">✕</button>
            </div>

            <div className="p-5 space-y-6">
              {/* Infos générales */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Informations générales</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Téléphone :</span> <span className="font-medium">{selected.telephone || '-'}</span></div>
                  <div><span className="text-gray-500">Région :</span> <span className="font-medium">{selected.region || '-'}</span></div>
                  <div><span className="text-gray-500">Secteur :</span> <span className="font-medium">{selected.secteur || '-'}</span></div>
                  <div><span className="text-gray-500">Statut :</span> <span className={`text-xs px-2 py-0.5 rounded-full ${statutColor(selected.statut)}`}>{selected.statut}</span></div>
                  <div><span className="text-gray-500">Début :</span> <span className="font-medium">{formatDate(selected.dateDebut)}</span></div>
                  <div><span className="text-gray-500">Rôle :</span> <span className="font-medium">{selected.user?.role}</span></div>
                </div>
              </div>

              {/* RSAC & RC Pro */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Conformité réglementaire</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className={`p-3 rounded-lg ${getDaysUntil(selected.dateValiditeRSAC) !== null && getDaysUntil(selected.dateValiditeRSAC)! < 30 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-500">N° RSAC</p>
                    <p className="font-medium">{selected.numeroRSAC || 'Non renseigné'}</p>
                    <p className="text-xs text-gray-400 mt-1">Expire : {formatDate(selected.dateValiditeRSAC)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getDaysUntil(selected.dateValiditeRCPro) !== null && getDaysUntil(selected.dateValiditeRCPro)! < 30 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-500">RC Pro</p>
                    <p className="font-medium">{selected.assureurRCPro || 'Non renseigné'}</p>
                    <p className="text-xs text-gray-400 mt-1">Expire : {formatDate(selected.dateValiditeRCPro)}</p>
                  </div>
                </div>
              </div>

              {/* Objectifs */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Objectifs</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600">Objectif mensuel</p>
                    <p className="text-lg font-bold text-blue-800">{(selected.objectifMensuel || 0).toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600">Objectif annuel</p>
                    <p className="text-lg font-bold text-green-800">{(selected.objectifAnnuel || 0).toLocaleString('fr-FR')} €</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selected.documents?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Documents ({selected.documents.length})</h3>
                  <div className="space-y-2">
                    {selected.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-700">{doc.nom}</span>
                        <div className="flex items-center gap-2">
                          {doc.dateExpiration && (
                            <span className="text-xs text-gray-400">{formatDate(doc.dateExpiration)}</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${statutColor(doc.statut)}`}>
                            {doc.statut}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commissions récentes */}
              {selected.commissions?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Commissions récentes</h3>
                  <div className="space-y-1">
                    {selected.commissions.slice(0, 6).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{c.periode}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">{c.montantCommission.toLocaleString('fr-FR')} €</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${statutColor(c.statut)}`}>
                            {c.statut}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
              <h2 className="font-semibold">Nouveau commercial</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                  <input required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                  <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe *</label>
                  <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rôle</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Région</label>
                  <input value={form.region} onChange={e => setForm({...form, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">N° RSAC</label>
                  <input value={form.numeroRSAC} onChange={e => setForm({...form, numeroRSAC: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objectif mensuel (€)</label>
                  <input type="number" value={form.objectifMensuel} onChange={e => setForm({...form, objectifMensuel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Création...' : 'Créer le commercial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
