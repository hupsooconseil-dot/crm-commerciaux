'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/app/lib/utils'

async function exportPDF(elementId: string, filename: string) {
  const { default: html2canvas } = await import('html2canvas')
  const { default: jsPDF } = await import('jspdf')
  const element = document.getElementById(elementId)
  if (!element) return
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width
  let y = 0
  while (y < imgH) {
    pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
    y += pageH
    if (y < imgH) pdf.addPage()
  }
  pdf.save(filename)
}

interface LigneDevis {
  id: string
  kitId: string | null
  designation: string
  description: string | null
  quantite: number
  prixUnitaireHT: number
  tva: number
  totalHT: number
  ordre: number
}

interface Devis {
  id: string
  reference: string
  statut: string
  clientNom: string
  clientEmail: string | null
  clientTelephone: string | null
  clientAdresse: string | null
  clientVille: string | null
  clientCodePostal: string | null
  typeClient: string
  montantHT: number
  montantTTC: number
  montantAides: number
  labelAides: string | null
  dateDevis: string
  dateValidite: string | null
  notes: string | null
  lignes: LigneDevis[]
  commercial: { nom: string; prenom: string } | null
  prospect: { raisonSociale: string; email: string | null; telephone: string | null; ville: string | null } | null
}

const STATUTS = ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE']
const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon', ENVOYE: 'Envoyé', ACCEPTE: 'Accepté', REFUSE: 'Refusé', EXPIRE: 'Expiré',
}
const STATUT_COLORS: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  ENVOYE: 'bg-blue-100 text-blue-700',
  ACCEPTE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-700',
  EXPIRE: 'bg-yellow-100 text-yellow-700',
}

function calcTTC(ht: number, tva: number) { return ht * (1 + tva / 100) }

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

  const [devis, setDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [editStatut, setEditStatut] = useState(false)
  const [newStatut, setNewStatut] = useState('')

  useEffect(() => {
    fetch(`/api/devis/${id}`).then(r => r.json()).then(d => {
      setDevis(d)
      setNewStatut(d.statut)
      setLoading(false)
    })
  }, [id])

  async function updateStatut() {
    if (!devis) return
    setSaving(true)
    const res = await fetch(`/api/devis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    })
    const data = await res.json()
    setDevis(d => d ? { ...d, statut: data.statut } : d)
    setEditStatut(false)
    setSaving(false)
  }

  async function deleteDevis() {
    if (!confirm('Supprimer ce devis définitivement ?')) return
    await fetch(`/api/devis/${id}`, { method: 'DELETE' })
    router.push('/devis')
  }

  async function downloadPDF() {
    setGeneratingPDF(true)
    await exportPDF('print-zone', `${devis?.reference || 'devis'}.pdf`)
    setGeneratingPDF(false)
  }

  function print() {
    window.print()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>
  if (!devis) return <div className="p-8 text-center text-gray-500">Devis introuvable</div>

  const montantTVA = devis.lignes.reduce((s, l) => s + calcTTC(l.totalHT, l.tva) - l.totalHT, 0)

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-zone, #print-zone * { visibility: visible; }
          #print-zone { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <div className="flex items-center gap-3">
            <Link href="/devis" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-mono">{devis.reference}</h1>
              <p className="text-sm text-gray-500">Créé le {formatDate(devis.dateDevis)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF} disabled={generatingPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {generatingPDF ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Génération...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Télécharger PDF
                </>
              )}
            </button>
            <button onClick={print}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
            <button onClick={deleteDevis}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
              Supprimer
            </button>
          </div>
        </div>

        {/* Printable zone */}
        <div id="print-zone" ref={printRef} className="space-y-5">

          {/* Status bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 no-print">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUT_COLORS[devis.statut]}`}>
                  {STATUT_LABELS[devis.statut]}
                </span>
                {devis.dateValidite && (
                  <span className="text-sm text-gray-500">Valide jusqu'au {formatDate(devis.dateValidite)}</span>
                )}
              </div>
              {!editStatut ? (
                <button onClick={() => setEditStatut(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Changer le statut
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select value={newStatut} onChange={e => setNewStatut(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                  </select>
                  <button onClick={updateStatut} disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? '...' : 'Valider'}
                  </button>
                  <button onClick={() => setEditStatut(false)} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Devis document */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Company header */}
            <div className="bg-blue-600 text-white px-8 py-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">SOLENYX ENERGIE</h2>
                  <p className="text-blue-200 text-sm mt-1">Solutions photovoltaïques</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">DEVIS</p>
                  <p className="text-blue-200 font-mono text-sm">{devis.reference}</p>
                  <p className="text-blue-200 text-sm mt-1">Date : {formatDate(devis.dateDevis)}</p>
                  {devis.dateValidite && (
                    <p className="text-blue-200 text-sm">Valide jusqu'au : {formatDate(devis.dateValidite)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Émetteur</p>
                  <p className="font-semibold text-gray-900">Solenyx Energie</p>
                  {devis.commercial && (
                    <p className="text-sm text-gray-600">{devis.commercial.prenom} {devis.commercial.nom}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Client</p>
                  <p className="font-semibold text-gray-900">{devis.clientNom}</p>
                  {devis.clientAdresse && <p className="text-sm text-gray-600">{devis.clientAdresse}</p>}
                  {(devis.clientCodePostal || devis.clientVille) && (
                    <p className="text-sm text-gray-600">{devis.clientCodePostal} {devis.clientVille}</p>
                  )}
                  {devis.clientEmail && <p className="text-sm text-gray-600">{devis.clientEmail}</p>}
                  {devis.clientTelephone && <p className="text-sm text-gray-600">{devis.clientTelephone}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {devis.typeClient === 'PARTICULIER' ? 'Particulier' : 'Professionnel'}
                  </p>
                </div>
              </div>

              {/* Lines */}
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="pb-3 text-left font-semibold text-gray-700">Désignation</th>
                    <th className="pb-3 text-center font-semibold text-gray-700 w-16">Qté</th>
                    <th className="pb-3 text-right font-semibold text-gray-700 w-28">P.U. HT</th>
                    <th className="pb-3 text-center font-semibold text-gray-700 w-16">TVA</th>
                    <th className="pb-3 text-right font-semibold text-gray-700 w-28">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devis.lignes.map(l => (
                    <tr key={l.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{l.designation}</p>
                        {l.description && <p className="text-xs text-gray-500 mt-0.5">{l.description}</p>}
                      </td>
                      <td className="py-3 text-center text-gray-700">{l.quantite}</td>
                      <td className="py-3 text-right text-gray-700">{formatCurrency(l.prixUnitaireHT)}</td>
                      <td className="py-3 text-center text-gray-500 text-xs">{l.tva}%</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(l.totalHT)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total HT</span>
                    <span>{formatCurrency(devis.montantHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>TVA</span>
                    <span>{formatCurrency(montantTVA)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 border-t-2 border-gray-200 pt-2">
                    <span>Total TTC</span>
                    <span className="text-blue-600">{formatCurrency(devis.montantTTC)}</span>
                  </div>
                  {devis.montantAides > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-700 pt-1">
                        <span>{devis.labelAides || 'Aides et subventions'}</span>
                        <span>- {formatCurrency(devis.montantAides)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-green-600 text-white rounded-xl px-4 py-3 mt-2">
                        <span className="font-bold text-sm">RESTE À CHARGE CLIENT</span>
                        <span className="text-xl font-bold">{formatCurrency(Math.max(0, devis.montantTTC - devis.montantAides))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes particulières */}
              {devis.notes && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conditions particulières</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{devis.notes}</p>
                </div>
              )}

              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Acceptation du devis</p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-6">Pour Solenyx Energie — Signature :</p>
                    <div className="border-b border-gray-300 h-12"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pour le client — Bon pour accord :</p>
                    <p className="text-xs text-gray-400 mb-4">Date : ___/___/______</p>
                    <div className="border-b border-gray-300 h-12"></div>
                  </div>
                </div>
              </div>

              {/* CGV */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Conditions Générales de Vente</p>
                <div className="text-xs text-gray-500 space-y-2 leading-relaxed columns-2 gap-6">
                  <p><strong className="text-gray-600">Art. 1 — Objet.</strong> Les présentes CGV régissent les relations contractuelles entre Solenyx Energie (ci-après "le Vendeur") et tout client (ci-après "le Client") dans le cadre de la fourniture et de l'installation de systèmes photovoltaïques et de services associés.</p>
                  <p><strong className="text-gray-600">Art. 2 — Validité du devis.</strong> Le présent devis est valable pendant la durée indiquée en première page. Passé ce délai, les prix pourront être révisés. L'acceptation du devis par le Client vaut conclusion du contrat.</p>
                  <p><strong className="text-gray-600">Art. 3 — Prix.</strong> Les prix sont indiqués en euros HT et TTC. Les taux de TVA applicables sont ceux en vigueur à la date de facturation. Pour les travaux de rénovation énergétique sur logements de plus de 2 ans, le taux réduit de 10 % s'applique conformément à l'art. 279-0 bis du CGI.</p>
                  <p><strong className="text-gray-600">Art. 4 — Modalités de paiement.</strong> Un acompte de 30 % est exigible à la signature du devis. Le solde est dû à la réception des travaux. Tout retard de paiement entraîne des pénalités au taux légal en vigueur, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement.</p>
                  <p><strong className="text-gray-600">Art. 5 — Aides et subventions.</strong> Les aides financières indiquées (MaPrimeRénov', CEE, aides locales) sont estimées selon la réglementation en vigueur. Le Vendeur accompagne le Client dans les démarches mais ne peut garantir l'obtention des aides, celles-ci étant soumises à l'éligibilité du Client et aux décisions des organismes concernés. Le montant TTC reste dû en totalité indépendamment de l'obtention des aides.</p>
                  <p><strong className="text-gray-600">Art. 6 — Droit de rétractation.</strong> Conformément aux articles L. 221-18 et suivants du Code de la consommation, le Client bénéficie d'un délai de rétractation de 14 jours calendaires à compter de la signature du présent devis. Passé ce délai, aucune annulation ne pourra être acceptée sans frais.</p>
                  <p><strong className="text-gray-600">Art. 7 — Délais d'installation.</strong> Les délais d'installation sont donnés à titre indicatif et peuvent varier en fonction des contraintes administratives (Consuel, Enedis, mairie) et des conditions météorologiques. Aucun retard d'installation n'ouvre droit à indemnité sauf faute grave du Vendeur.</p>
                  <p><strong className="text-gray-600">Art. 8 — Garanties.</strong> Les équipements bénéficient des garanties fabricants : 25 ans de rendement sur les panneaux, 10 ans sur les onduleurs (sauf mention contraire). La main d'œuvre est garantie 2 ans à compter de la date de réception des travaux. Ces garanties ne couvrent pas les dommages liés à un mauvais usage, une cause externe ou un défaut d'entretien.</p>
                  <p><strong className="text-gray-600">Art. 9 — Propriété.</strong> Les équipements installés restent la propriété du Vendeur jusqu'au paiement complet du prix. En cas de non-paiement, le Vendeur pourra revendiquer la restitution du matériel.</p>
                  <p><strong className="text-gray-600">Art. 10 — Responsabilité.</strong> Le Vendeur ne pourra être tenu responsable des dommages indirects liés à l'utilisation de l'installation. La responsabilité du Vendeur est limitée au montant du contrat. Le Client s'engage à souscrire une assurance habitation couvrant les panneaux solaires.</p>
                  <p><strong className="text-gray-600">Art. 11 — Données personnelles.</strong> Les données collectées sont traitées conformément au RGPD à des fins de gestion du contrat. Le Client dispose d'un droit d'accès, de rectification et de suppression de ses données en contactant le Vendeur.</p>
                  <p><strong className="text-gray-600">Art. 12 — Litiges.</strong> En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le tribunal compétent sera celui du siège social du Vendeur.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
