'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'

export default function EquipesPage() {
  const session = useSession()
  const [reseaux, setReseaux] = useState<any[]>([])
  const [equipes, setEquipes] = useState<any[]>([])
  const [commerciaux, setCommerciaux] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'organigramme' | 'reseaux' | 'equipes'>('organigramme')
  const [showReseauForm, setShowReseauForm] = useState(false)
  const [showEquipeForm, setShowEquipeForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reseauForm, setReseauForm] = useState({ nom: '', region: '', chefReseauId: '' })
  const [equipeForm, setEquipeForm] = useState({ nom: '', reseauId: '', chefEquipeId: '' })

  const isAdmin = session?.role === 'ADMIN' || session?.role === 'MANAGER'

  const load = () => {
    Promise.all([
      fetch('/api/reseaux').then(r => r.json()),
      fetch('/api/equipes').then(r => r.json()),
      fetch('/api/commerciaux').then(r => r.json()),
    ]).then(([r, e, c]) => {
      setReseaux(Array.isArray(r) ? r : [])
      setEquipes(Array.isArray(e) ? e : [])
      setCommerciaux(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function createReseau(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/reseaux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reseauForm),
    })
    setShowReseauForm(false)
    setSaving(false)
    setReseauForm({ nom: '', region: '', chefReseauId: '' })
    load()
  }

  async function createEquipe(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/equipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipeForm),
    })
    setShowEquipeForm(false)
    setSaving(false)
    setEquipeForm({ nom: '', reseauId: '', chefEquipeId: '' })
    load()
  }

  async function deleteReseau(id: string) {
    if (!confirm('Supprimer ce réseau ? Les équipes associées seront détachées.')) return
    await fetch(`/api/reseaux/${id}`, { method: 'DELETE' })
    load()
  }

  async function deleteEquipe(id: string) {
    if (!confirm('Supprimer cette équipe ? Les membres seront détachés.')) return
    await fetch(`/api/equipes/${id}`, { method: 'DELETE' })
    load()
  }

  async function assignMembre(commercialId: string, equipeId: string) {
    await fetch(`/api/admin/utilisateurs/${commercialId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipeId: equipeId || null }),
    })
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const totalMembers = equipes.reduce((s, e) => s + (e.membres?.length || 0), 0)

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organisation commerciale</h1>
          <p className="text-sm text-gray-500">
            {reseaux.length} réseau{reseaux.length !== 1 ? 'x' : ''} · {equipes.length} équipe{equipes.length !== 1 ? 's' : ''} · {totalMembers} commerciaux affectés
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowReseauForm(true)}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              + Réseau
            </button>
            <button onClick={() => setShowEquipeForm(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + Équipe
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'organigramme', label: '🌳 Organigramme' },
          { key: 'reseaux', label: `🌐 Réseaux (${reseaux.length})` },
          { key: 'equipes', label: `👥 Équipes (${equipes.length})` },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'organigramme' && (
        <div className="space-y-6">
          {reseaux.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm text-gray-400">
              <div className="text-4xl mb-3">🌐</div>
              <p>Aucun réseau créé</p>
              {isAdmin && <button onClick={() => setShowReseauForm(true)} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Créer le premier réseau</button>}
            </div>
          ) : (
            reseaux.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌐</span>
                      <h2 className="font-bold text-lg">{r.nom}</h2>
                      {r.region && <span className="text-purple-200 text-sm">— {r.region}</span>}
                    </div>
                    {r.chefReseau && (
                      <p className="text-purple-100 text-sm mt-0.5">
                        Chef de réseau : {r.chefReseau.prenom} {r.chefReseau.nom}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <button onClick={() => deleteReseau(r.id)} className="text-purple-200 hover:text-white text-sm px-2 py-1 rounded">✕</button>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {r.equipes?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune équipe dans ce réseau</p>
                  ) : (
                    r.equipes?.map((eq: any) => (
                      <div key={eq.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span>👥</span>
                              <span className="font-semibold text-sm text-gray-900">{eq.nom}</span>
                              <span className="text-xs text-gray-400">({eq.membres?.length || 0} membres)</span>
                            </div>
                            {eq.chefEquipe && (
                              <p className="text-xs text-blue-600 mt-0.5">
                                Chef d'équipe : {eq.chefEquipe.prenom} {eq.chefEquipe.nom}
                              </p>
                            )}
                          </div>
                        </div>
                        {eq.membres?.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
                            {eq.membres.map((m: any) => (
                              <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {m.prenom?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{m.prenom} {m.nom}</p>
                                  <p className="text-xs text-gray-400">{m.statut}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}

          {/* Sans équipe */}
          {(() => {
            const assignedIds = equipes.flatMap(e => e.membres?.map((m: any) => m.id) || [])
            const unassigned = commerciaux.filter(c => !assignedIds.includes(c.id))
            if (unassigned.length === 0) return null
            return (
              <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                  <span>⚠️</span>
                  <h3 className="font-semibold text-orange-800 text-sm">Sans équipe ({unassigned.length})</h3>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {unassigned.map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.prenom?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">{c.prenom} {c.nom}</p>
                        {isAdmin && equipes.length > 0 && (
                          <select
                            onChange={e => e.target.value && assignMembre(c.id, e.target.value)}
                            defaultValue=""
                            className="text-xs text-blue-600 bg-transparent w-full cursor-pointer mt-0.5"
                          >
                            <option value="">Affecter...</option>
                            {equipes.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {activeTab === 'reseaux' && (
        <div className="space-y-3">
          {reseaux.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{r.nom}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.region || 'Toute France'} · {r.equipes?.length || 0} équipe(s) · Chef : {r.chefReseau ? `${r.chefReseau.prenom} ${r.chefReseau.nom}` : 'Non défini'}
                </p>
              </div>
              {isAdmin && (
                <button onClick={() => deleteReseau(r.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Supprimer</button>
              )}
            </div>
          ))}
          {reseaux.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">Aucun réseau</div>}
        </div>
      )}

      {activeTab === 'equipes' && (
        <div className="space-y-3">
          {equipes.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{e.nom}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {e.reseau?.nom ? `Réseau : ${e.reseau.nom}` : 'Sans réseau'} · {e.membres?.length || 0} membre(s)
                    {e.chefEquipe && ` · Chef : ${e.chefEquipe.prenom} ${e.chefEquipe.nom}`}
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => deleteEquipe(e.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Supprimer</button>
                )}
              </div>
              {e.membres?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {e.membres.map((m: any) => (
                    <span key={m.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {m.prenom} {m.nom}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {equipes.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">Aucune équipe</div>}
        </div>
      )}

      {/* Modal réseau */}
      {showReseauForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Créer un réseau</h2>
              <button onClick={() => setShowReseauForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={createReseau} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom du réseau *</label>
                <input required value={reseauForm.nom} onChange={e => setReseauForm({...reseauForm, nom: e.target.value})}
                  placeholder="Ex: Réseau Sud-Est"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Région</label>
                <input value={reseauForm.region} onChange={e => setReseauForm({...reseauForm, region: e.target.value})}
                  placeholder="Ex: PACA, Occitanie..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chef de réseau</label>
                <select value={reseauForm.chefReseauId} onChange={e => setReseauForm({...reseauForm, chefReseauId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Sélectionner un commercial</option>
                  {commerciaux.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReseauForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  {saving ? 'Création...' : 'Créer le réseau'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal équipe */}
      {showEquipeForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">Créer une équipe</h2>
              <button onClick={() => setShowEquipeForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={createEquipe} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom de l'équipe *</label>
                <input required value={equipeForm.nom} onChange={e => setEquipeForm({...equipeForm, nom: e.target.value})}
                  placeholder="Ex: Équipe Rhône-Alpes"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Réseau parent</label>
                <select value={equipeForm.reseauId} onChange={e => setEquipeForm({...equipeForm, reseauId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Sans réseau</option>
                  {reseaux.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chef d'équipe</label>
                <select value={equipeForm.chefEquipeId} onChange={e => setEquipeForm({...equipeForm, chefEquipeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Sélectionner un commercial</option>
                  {commerciaux.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEquipeForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  {saving ? 'Création...' : "Créer l'équipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
