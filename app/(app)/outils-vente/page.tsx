'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'

const CATEGORIES_VENTE = [
  { value: 'PRESENTATION', label: 'Présentations', icon: '📊', desc: 'Slides de présentation client' },
  { value: 'ARGUMENTAIRE', label: 'Argumentaires', icon: '💬', desc: 'Scripts et arguments de vente' },
  { value: 'SIMULATION', label: 'Simulateurs', icon: '🔢', desc: 'Outils de simulation et ROI' },
  { value: 'CYCLE_VENTE', label: 'Cycle de vente', icon: '🔄', desc: 'Étapes et processus commercial' },
  { value: 'OBJECTIONS', label: 'Gestion objections', icon: '🛡️', desc: 'Réponses aux objections courantes' },
  { value: 'CONTRATS', label: 'Documents contrat', icon: '✍️', desc: 'Modèles et aide à la signature' },
]

const CYCLE_VENTE = [
  { num: 1, titre: 'Prospection & Premier contact', icon: '🎯', color: 'bg-purple-50 border-purple-200', desc: 'Identification des prospects, prise de contact, qualification du besoin énergétique.' },
  { num: 2, titre: 'Découverte & Audit', icon: '🔍', color: 'bg-blue-50 border-blue-200', desc: 'Analyse de la toiture, étude de consommation, identification du projet optimal (résidentiel, pro, ombrière...).' },
  { num: 3, titre: 'Proposition & Chiffrage', icon: '📋', color: 'bg-cyan-50 border-cyan-200', desc: 'Dimensionnement, étude de rentabilité (ROI), présentation des aides financières (MaPrimeRénov, TVA 10%).' },
  { num: 4, titre: 'Présentation & Démonstration', icon: '📊', color: 'bg-green-50 border-green-200', desc: 'Présentation de l\'offre SOLENYX, démonstration monitoring, références clients, garanties.' },
  { num: 5, titre: 'Négociation & Closing', icon: '🤝', color: 'bg-yellow-50 border-yellow-200', desc: 'Traitement des objections, finalisation des conditions, signature du contrat d\'installation.' },
  { num: 6, titre: 'Suivi après-vente', icon: '⭐', color: 'bg-orange-50 border-orange-200', desc: 'Accompagnement installation, formation client sur monitoring, recommandation & parrainage.' },
]

export default function OutilsVentePage() {
  const session = useSession()
  const [activeTab, setActiveTab] = useState<'cycle' | 'outils'>('cycle')

  const isAdmin = session?.role === 'ADMIN' || session?.role === 'MANAGER'

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Outils de vente</h1>
        <p className="text-sm text-gray-500">Supports commerciaux, cycle de vente et présentations client SOLENYX ENERGIE</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('cycle')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cycle' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          🔄 Cycle de vente
        </button>
        <button
          onClick={() => setActiveTab('outils')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'outils' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          📦 Supports & outils
        </button>
      </div>

      {activeTab === 'cycle' && (
        <div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6">
            <h2 className="text-lg font-bold mb-1">Cycle de vente SOLENYX ENERGIE</h2>
            <p className="text-blue-100 text-sm">6 étapes pour accompagner votre client de la prospection à l'installation</p>
          </div>
          <div className="space-y-3">
            {CYCLE_VENTE.map(step => (
              <div key={step.num} className={`border rounded-xl p-4 ${step.color}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl flex-shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">ÉTAPE {step.num}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{step.titre}</h3>
                    <p className="text-xs text-gray-600 mt-1">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'outils' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES_VENTE.map(cat => (
              <div key={cat.value} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{cat.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{cat.label}</h3>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400 mb-1">Aucun contenu disponible</p>
                  {isAdmin && (
                    <p className="text-xs text-blue-500">Contenu à venir — ajout depuis la bibliothèque</p>
                  )}
                </div>
                {isAdmin && (
                  <button className="w-full mt-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    + Ajouter du contenu
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">📋 Espace en cours de construction</h3>
            <p className="text-sm text-blue-700">
              Cet espace accueillera vos présentations commerciales, argumentaires produits, simulateurs de ROI et supports de closing.
              Les slides et documents seront intégrés prochainement.
            </p>
            {isAdmin && (
              <p className="text-xs text-blue-500 mt-2">
                En tant qu'administrateur, vous pourrez ajouter des supports depuis la <strong>Bibliothèque de documents</strong>.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
