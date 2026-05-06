'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/app/lib/utils'

interface Kit {
  id: string
  nom: string
  categorie: string
  description: string | null
  puissanceKwc: number | null
  nbPanneaux: number | null
  marque: string | null
  prixHT: number
  tva: number
}

interface Ligne {
  kitId: string | null
  designation: string
  description: string
  quantite: number
  prixUnitaireHT: number
  tva: number
  totalHT: number
}

interface Prospect {
  id: string
  raisonSociale: string
  contactNom: string | null
  contactPrenom: string | null
  email: string | null
  telephone: string | null
  ville: string | null
}

const CATEGORIES: Record<string, string> = {
  RESIDENTIEL: 'Résidentiel',
  PROFESSIONNEL: 'Professionnel',
  BATTERIE: 'Batteries',
  IRVE: 'Borne IRVE',
  OMBRIERE: 'Ombrières',
  OPTION: 'Options',
}

const CAT_COLORS: Record<string, string> = {
  RESIDENTIEL: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  PROFESSIONNEL: 'bg-purple-50 border-purple-200 hover:border-purple-400',
  BATTERIE: 'bg-green-50 border-green-200 hover:border-green-400',
  IRVE: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
  OMBRIERE: 'bg-orange-50 border-orange-200 hover:border-orange-400',
  OPTION: 'bg-gray-50 border-gray-200 hover:border-gray-400',
}

function calcTTC(ht: number, tva: number) { return ht * (1 + tva / 100) }

export default function NouveauDevisPage() {
  const router = useRouter()
  const [kits, setKits] = useState<Kit[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState<'kits' | 'manuel'>('kits')
  const [filterCat, setFilterCat] = useState('')

  const [form, setForm] = useState({
    prospectId: '',
    clientPrenom: '',
    clientNom: '',
    clientEmail: '',
    clientTelephone: '',
    clientAdresse: '',
    clientVille: '',
    clientCodePostal: '',
    typeClient: 'PARTICULIER',
    dateValidite: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
    montantAides: 0,
    labelAides: 'MaPrimeRénov\' + CEE',
    modeFinancement: 'COMPTANT',
    infoDecennale: '',
  })

  const [newLigne, setNewLigne] = useState<Ligne>({
    kitId: null, designation: '', description: '', quantite: 1, prixUnitaireHT: 0, tva: 10, totalHT: 0,
  })

  useEffect(() => {
    fetch('/api/kits').then(r => r.json()).then(setKits)
    fetch('/api/prospects').then(r => r.json()).then(setProspects)
  }, [])

  function onProspectChange(id: string) {
    const p = prospects.find(p => p.id === id)
    if (!p) { setForm(f => ({ ...f, prospectId: '' })); return }
    setForm(f => ({
      ...f,
      prospectId: id,
      clientPrenom: p.contactPrenom || '',
      clientNom: p.contactNom || p.raisonSociale,
      clientEmail: p.email || '',
      clientTelephone: p.telephone || '',
      clientVille: p.ville || '',
    }))
  }

  function addKit(kit: Kit) {
    const tva = form.typeClient === 'PARTICULIER' ? kit.tva : 20
    const totalHT = kit.prixHT
    setLignes(l => [...l, {
      kitId: kit.id,
      designation: kit.nom,
      description: kit.description || '',
      quantite: 1,
      prixUnitaireHT: kit.prixHT,
      tva,
      totalHT,
    }])
  }

  function removeLigne(i: number) {
    setLignes(l => l.filter((_, idx) => idx !== i))
  }

  function updateLigne(i: number, field: keyof Ligne, val: string | number) {
    setLignes(l => l.map((ligne, idx) => {
      if (idx !== i) return ligne
      const updated = { ...ligne, [field]: val }
      updated.totalHT = updated.quantite * updated.prixUnitaireHT
      return updated
    }))
  }

  function addManuel() {
    if (!newLigne.designation) return
    const totalHT = newLigne.quantite * newLigne.prixUnitaireHT
    setLignes(l => [...l, { ...newLigne, totalHT }])
    setNewLigne({ kitId: null, designation: '', description: '', quantite: 1, prixUnitaireHT: 0, tva: 10, totalHT: 0 })
  }

  const montantHT = lignes.reduce((s, l) => s + l.totalHT, 0)
  const montantTTC = lignes.reduce((s, l) => s + calcTTC(l.totalHT, l.tva), 0)

  const grouped = kits.reduce((acc, k) => {
    if (!acc[k.categorie]) acc[k.categorie] = []
    acc[k.categorie].push(k)
    return acc
  }, {} as Record<string, Kit[]>)

  const filteredKits = filterCat ? kits.filter(k => k.categorie === filterCat) : kits

  async function save(statut: string) {
    if (!form.clientNom) { setSaveError('Le nom du client est requis'); return }
    setSaving(true)
    setSaveError('')
    const payload = {
      ...form,
      statut,
      montantHT,
      montantTTC,
      lignes: lignes.map((l, i) => ({ ...l, ordre: i })),
    }
    try {
      const res = await fetch('/api/devis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setSaving(false)
      if (res.ok) {
        router.push(`/devis?nouveau=${data.id}`)
      } else {
        setSaveError(`Erreur ${res.status} : ${data.error || 'Impossible de créer le devis'}`)
      }
    } catch (e: any) {
      setSaving(false)
      setSaveError(`Erreur réseau : ${e.message}`)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devis" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nouveau devis</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Informations client</h2>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prospect existant (optionnel)</label>
                <select value={form.prospectId} onChange={e => onProspectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Saisie manuelle --</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.raisonSociale} {p.contactNom ? `(${p.contactNom})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prénom</label>
                  <input type="text" value={form.clientPrenom} onChange={e => setForm(f => ({ ...f, clientPrenom: e.target.value }))}
                    placeholder="Prénom du contact"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nom / Société *</label>
                  <input type="text" value={form.clientNom} onChange={e => setForm(f => ({ ...f, clientNom: e.target.value }))}
                    placeholder="Nom ou raison sociale"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.typeClient} onChange={e => setForm(f => ({ ...f, typeClient: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white col-span-2">
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                  <input type="tel" value={form.clientTelephone} onChange={e => setForm(f => ({ ...f, clientTelephone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
                <input type="text" value={form.clientAdresse} onChange={e => setForm(f => ({ ...f, clientAdresse: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code postal</label>
                  <input type="text" value={form.clientCodePostal} onChange={e => setForm(f => ({ ...f, clientCodePostal: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
                  <input type="text" value={form.clientVille} onChange={e => setForm(f => ({ ...f, clientVille: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Lignes du devis</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab('kits')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'kits' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Kits catalogue
              </button>
              <button onClick={() => setActiveTab('manuel')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'manuel' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Ligne manuelle
              </button>
            </div>

            {activeTab === 'kits' && (
              <div>
                {/* Category filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => setFilterCat('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCat === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Tous
                  </button>
                  {Object.keys(grouped).map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCat === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {CATEGORIES[cat] || cat}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {filteredKits.map(kit => (
                    <div key={kit.id}
                      className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${CAT_COLORS[kit.categorie] || 'bg-gray-50 border-gray-200'}`}
                      onClick={() => addKit(kit)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{kit.nom}</p>
                          {kit.puissanceKwc && <p className="text-xs text-gray-500">{kit.puissanceKwc} kWc{kit.nbPanneaux ? ` · ${kit.nbPanneaux} panneaux` : ''}</p>}
                          {kit.marque && <p className="text-xs text-gray-400">{kit.marque}</p>}
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <p className="font-bold text-gray-900 text-sm">{formatCurrency(kit.prixHT)}</p>
                          <p className="text-xs text-gray-400">HT · TVA {kit.tva}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-1.5 font-medium">+ Ajouter</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'manuel' && (
              <div className="grid gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Désignation *</label>
                  <input type="text" value={newLigne.designation} onChange={e => setNewLigne(l => ({ ...l, designation: e.target.value }))}
                    placeholder="Ex: Main d'œuvre pose"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input type="text" value={newLigne.description} onChange={e => setNewLigne(l => ({ ...l, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantité</label>
                    <input type="number" min={1} value={newLigne.quantite} onChange={e => setNewLigne(l => ({ ...l, quantite: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prix HT (€)</label>
                    <input type="number" min={0} step={0.01} value={newLigne.prixUnitaireHT} onChange={e => setNewLigne(l => ({ ...l, prixUnitaireHT: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TVA (%)</label>
                    <select value={newLigne.tva} onChange={e => setNewLigne(l => ({ ...l, tva: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value={5.5}>5,5%</option>
                      <option value={10}>10%</option>
                      <option value={20}>20%</option>
                    </select>
                  </div>
                </div>
                <button onClick={addManuel}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Ajouter cette ligne
                </button>
              </div>
            )}

            {/* Lines table */}
            {lignes.length > 0 && (
              <div className="mt-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="pb-2 text-left font-medium">Désignation</th>
                        <th className="pb-2 text-center font-medium w-16">Qté</th>
                        <th className="pb-2 text-right font-medium w-24">P.U. HT</th>
                        <th className="pb-2 text-center font-medium w-16">TVA</th>
                        <th className="pb-2 text-right font-medium w-24">Total HT</th>
                        <th className="pb-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lignes.map((l, i) => (
                        <tr key={i} className="group">
                          <td className="py-2 pr-2">
                            <input type="text" value={l.designation} onChange={e => updateLigne(i, 'designation', e.target.value)}
                              className="w-full text-sm text-gray-900 focus:outline-none focus:bg-blue-50 rounded px-1 py-0.5" />
                            {l.description && <p className="text-xs text-gray-400 px-1">{l.description}</p>}
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" min={1} value={l.quantite} onChange={e => updateLigne(i, 'quantite', Number(e.target.value))}
                              className="w-full text-center text-sm focus:outline-none focus:bg-blue-50 rounded px-1 py-0.5" />
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" min={0} step={0.01} value={l.prixUnitaireHT} onChange={e => updateLigne(i, 'prixUnitaireHT', Number(e.target.value))}
                              className="w-full text-right text-sm focus:outline-none focus:bg-blue-50 rounded px-1 py-0.5" />
                          </td>
                          <td className="py-2 px-1 text-center text-xs text-gray-500">{l.tva}%</td>
                          <td className="py-2 px-1 text-right font-medium text-gray-900">{formatCurrency(l.totalHT)}</td>
                          <td className="py-2">
                            <button onClick={() => removeLigne(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Notes et conditions</h2>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Conditions particulières, remarques..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block font-semibold text-gray-900 mb-1 text-sm">Assurance Décennale — Sous-traitant poseur</label>
              <p className="text-xs text-gray-400 mb-2">Nom de la société, assureur, numéro de police, validité...</p>
              <textarea value={form.infoDecennale} onChange={e => setForm(f => ({ ...f, infoDecennale: e.target.value }))}
                rows={3} placeholder="Ex: Pose réalisée par Électric Sud — Assuré AXA Pro, police n° 1234567, valide jusqu'au 31/12/2026"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Right — summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de validité</label>
              <input type="date" value={form.dateValidite} onChange={e => setForm(f => ({ ...f, dateValidite: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total HT</span>
                <span>{formatCurrency(montantHT)}</span>
              </div>
              {lignes.length > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>TVA</span>
                  <span>{formatCurrency(montantTTC - montantHT)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2">
                <span>Total TTC</span>
                <span className="text-blue-600">{formatCurrency(montantTTC)}</span>
              </div>
            </div>

            {/* Mode de financement */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mode de financement</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, modeFinancement: 'COMPTANT' }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.modeFinancement === 'COMPTANT' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <p className="text-sm font-semibold text-gray-900">Comptant</p>
                  <p className="text-xs text-gray-500 mt-0.5">Paiement direct avec aides</p>
                </button>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, modeFinancement: 'SUNLIB' }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.modeFinancement === 'SUNLIB' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <p className="text-sm font-semibold text-gray-900">🌞 SUNLIB</p>
                  <p className="text-xs text-gray-500 mt-0.5">Abonnement — 0€ de reste à charge</p>
                </button>
              </div>
            </div>

            {form.modeFinancement === 'COMPTANT' && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200 space-y-3">
                <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">Aides & Reste à charge</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Libellé des aides</label>
                  <input type="text" value={form.labelAides}
                    onChange={e => setForm(f => ({ ...f, labelAides: e.target.value }))}
                    placeholder="MaPrimeRénov' + CEE"
                    className="w-full px-2.5 py-1.5 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Montant des aides (€)</label>
                  <input type="number" min={0} step={100} value={form.montantAides}
                    onChange={e => setForm(f => ({ ...f, montantAides: Number(e.target.value) }))}
                    className="w-full px-2.5 py-1.5 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                </div>
                <div className="flex justify-between items-center border-t border-green-200 pt-2">
                  <span className="text-sm font-bold text-green-900">Reste à charge</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(Math.max(0, montantTTC - form.montantAides))}
                  </span>
                </div>
              </div>
            )}

            {form.modeFinancement === 'SUNLIB' && (
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-300 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌞</span>
                  <p className="text-sm font-bold text-orange-900">Solution SUNLIB</p>
                </div>
                <p className="text-xs text-orange-800">
                  Abonnement <strong>{form.typeClient === 'PARTICULIER' ? '25 ans' : '10 ans'}</strong> — mensualité fixée par SUNLIB à réception du contrat définitif.
                </p>
                <div className="flex justify-between items-center bg-green-600 text-white rounded-lg px-3 py-2 mt-1">
                  <span className="text-xs font-bold">RESTE À CHARGE</span>
                  <span className="text-base font-bold">0 €</span>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <button onClick={() => save('BROUILLON')} disabled={saving}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Enregistrement...</>
                ) : '✓ Valider et enregistrer le devis'}
              </button>
              <button onClick={() => save('ENVOYE')} disabled={saving}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Valider et marquer comme envoyé'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barre fixe en bas — toujours visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex flex-col gap-2 lg:pl-64">
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm font-medium">
            ⚠ {saveError}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={() => save('BROUILLON')} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50">
            {saving ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Enregistrement...</>
            ) : '✓ Valider le devis'}
          </button>
          <button onClick={() => save('ENVOYE')} disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? '...' : 'Valider + Envoyé'}
          </button>
        </div>
      </div>

      {/* Padding bas pour que le contenu ne soit pas caché par la barre fixe */}
      <div className="h-20" />
    </div>
  )
}
