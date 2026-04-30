'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'

const CATEGORIES = ['PRODUIT', 'VENTE', 'TECHNIQUE', 'REGLEMENTAIRE', 'SOFT_SKILLS']
const CAT_LABELS: Record<string, string> = {
  PRODUIT: 'Produit', VENTE: 'Vente', TECHNIQUE: 'Technique',
  REGLEMENTAIRE: 'Réglementaire', SOFT_SKILLS: 'Soft Skills'
}
const TYPE_LABELS: Record<string, string> = {
  E_LEARNING: 'E-Learning', PRESENTIEL: 'Présentiel', DISTANCE: 'À distance'
}
const NIVEAU_LABELS: Record<string, string> = {
  DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé'
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}

export default function FormationsPage() {
  const session = useSession()
  const [formations, setFormations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [formDetail, setFormDetail] = useState<any | null>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [quizDone, setQuizDone] = useState(false)
  const [moduleIdx, setModuleIdx] = useState(0)

  const load = () => {
    fetch('/api/formations')
      .then(r => r.json())
      .then(d => { setFormations(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function openFormation(f: any) {
    const detail = await fetch(`/api/formations/${f.id}`).then(r => r.json())
    setFormDetail(detail)
    setSelected(f)
    setModuleIdx(0)
    setQuizMode(false)
    setQuizDone(false)
    setAnswers([])
    setCurrentQuestion(0)
  }

  async function startQuiz() {
    setQuizMode(true)
    setCurrentQuestion(0)
    setAnswers([])
    setQuizDone(false)
  }

  async function answerQuestion(answerIdx: number) {
    const newAnswers = [...answers, answerIdx]
    setAnswers(newAnswers)

    const quizModule = formDetail.modules.find((m: any) => m.type === 'QUIZ')
    if (!quizModule) return

    if (newAnswers.length >= quizModule.questions.length) {
      const correct = newAnswers.filter((a, i) => a === quizModule.questions[i].bonneReponse).length
      const score = (correct / quizModule.questions.length) * 100
      setQuizDone(true)

      await fetch(`/api/formations/${selected.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, statut: 'TERMINE', progression: 100 }),
      }).catch(() => {})
    } else {
      setCurrentQuestion(newAnswers.length)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const isAdmin = session?.role === 'ADMIN' || session?.role === 'MANAGER'

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Formations</h1>
        <p className="text-sm text-gray-500">Module LMS — E-Learning et formation à distance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formations.map(f => {
          const progress = f.commerciaux?.[0]
          const progressPct = progress?.progression || 0
          const statut = progress?.statut || 'NON_COMMENCE'

          return (
            <div key={f.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openFormation(f)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {f.estObligatoire && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                        Obligatoire
                      </span>
                    )}
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                      {TYPE_LABELS[f.type]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{f.titre}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg ml-3 flex-shrink-0">
                  {f.categorie === 'PRODUIT' ? '📦' : f.categorie === 'VENTE' ? '🎯' : f.categorie === 'REGLEMENTAIRE' ? '⚖️' : '🎓'}
                </div>
              </div>

              {f.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{f.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                {f.duree && <span>⏱ {f.duree} min</span>}
                <span>📚 {f._count?.modules} module{f._count?.modules !== 1 ? 's' : ''}</span>
                {f.niveau && <span>📊 {NIVEAU_LABELS[f.niveau]}</span>}
                {isAdmin && <span>👥 {f._count?.commerciaux} inscrits</span>}
              </div>

              {!isAdmin && (
                <>
                  <ProgressBar value={progressPct} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{progressPct}%</span>
                    <span className={`text-xs font-medium ${
                      statut === 'TERMINE' ? 'text-green-600' :
                      statut === 'EN_COURS' ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {statut === 'TERMINE' ? '✓ Terminée' : statut === 'EN_COURS' ? 'En cours' : 'À commencer'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {formations.length === 0 && (
          <div className="col-span-3 bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
            Aucune formation disponible
          </div>
        )}
      </div>

      {/* Formation Detail Modal */}
      {selected && formDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">{selected.titre}</h2>
                <p className="text-sm text-gray-500">{CAT_LABELS[selected.categorie] || selected.categorie}</p>
              </div>
              <button onClick={() => { setSelected(null); setFormDetail(null) }} className="text-gray-400 ml-4">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!quizMode ? (
                <>
                  {/* Module navigation */}
                  {formDetail.modules.length > 1 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                      {formDetail.modules.map((m: any, i: number) => (
                        <button key={m.id} onClick={() => setModuleIdx(i)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            i === moduleIdx ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {i + 1}. {m.titre}
                        </button>
                      ))}
                    </div>
                  )}

                  {formDetail.modules[moduleIdx] && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">{formDetail.modules[moduleIdx].titre}</h3>
                      {formDetail.modules[moduleIdx].contenu && (
                        <div
                          className="prose prose-sm max-w-none text-gray-600"
                          dangerouslySetInnerHTML={{ __html: formDetail.modules[moduleIdx].contenu }}
                        />
                      )}
                      {formDetail.modules[moduleIdx].type === 'QUIZ' && formDetail.modules[moduleIdx].questions.length > 0 && (
                        <button onClick={startQuiz}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                          Lancer le quiz ({formDetail.modules[moduleIdx].questions.length} questions)
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : quizDone ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz terminé !</h3>
                  <p className="text-gray-600 mb-2">
                    Score : {answers.filter((a, i) => {
                      const quizM = formDetail.modules.find((m: any) => m.type === 'QUIZ')
                      return a === quizM?.questions[i]?.bonneReponse
                    }).length} / {answers.length} bonnes réponses
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(answers.filter((a, i) => {
                      const quizM = formDetail.modules.find((m: any) => m.type === 'QUIZ')
                      return a === quizM?.questions[i]?.bonneReponse
                    }).length / answers.length * 100)}%
                  </p>
                  <button onClick={() => setQuizMode(false)}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    Retour au contenu
                  </button>
                </div>
              ) : (
                (() => {
                  const quizModule = formDetail.modules.find((m: any) => m.type === 'QUIZ')
                  if (!quizModule || currentQuestion >= quizModule.questions.length) return null
                  const q = quizModule.questions[currentQuestion]
                  const choices = JSON.parse(q.choix || '[]')
                  return (
                    <div>
                      <p className="text-xs text-gray-400 mb-3">
                        Question {currentQuestion + 1} / {quizModule.questions.length}
                      </p>
                      <h3 className="font-semibold text-gray-900 mb-4">{q.question}</h3>
                      <div className="space-y-2">
                        {choices.map((choice: string, idx: number) => (
                          <button key={idx} onClick={() => answerQuestion(idx)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <span className="font-semibold text-blue-600 mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                {moduleIdx > 0 && !quizMode && (
                  <button onClick={() => setModuleIdx(m => m - 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    ← Précédent
                  </button>
                )}
              </div>
              {moduleIdx < formDetail.modules.length - 1 && !quizMode ? (
                <button onClick={() => setModuleIdx(m => m + 1)}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Suivant →
                </button>
              ) : (
                <span className="text-sm text-gray-400">
                  {selected.duree ? `⏱ ${selected.duree} min` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
