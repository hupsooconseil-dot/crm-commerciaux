'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'
import { formatDate, prioriteColor } from '@/app/lib/utils'

const TYPE_ICONS: Record<string, string> = {
  DOCUMENT_EXPIRE: '📄', INACTIVITE: '😴', OBJECTIF: '🎯',
  RSAC: '📋', RC_PRO: '🛡️', RELANCE: '🔔'
}

export default function AlertesPage() {
  const session = useSession()
  const [alertes, setAlertes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/alertes')
      .then(r => r.json())
      .then(d => { setAlertes(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function markRead(id: string) {
    await fetch(`/api/alertes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estLue: true, dateLecture: new Date().toISOString() }),
    })
    load()
  }

  async function markAllRead() {
    const unread = alertes.filter(a => !a.estLue)
    await Promise.all(unread.map(a => fetch(`/api/alertes/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estLue: true, dateLecture: new Date().toISOString() }),
    })))
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const unreadCount = alertes.filter(a => !a.estLue).length

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alertes & Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? (
              <span className="text-blue-600 font-medium">{unreadCount} nouvelle{unreadCount !== 1 ? 's' : ''}</span>
            ) : 'Tout est à jour'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alertes.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🔔</p>
            <p>Aucune alerte pour le moment</p>
          </div>
        ) : (
          alertes.map(a => (
            <div key={a.id}
              className={`bg-white rounded-xl shadow-sm border p-4 flex gap-4 items-start transition-colors ${
                a.estLue ? 'border-gray-100 opacity-70' : 'border-blue-200 bg-blue-50'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                a.priorite === 'CRITIQUE' ? 'bg-red-100' :
                a.priorite === 'HAUTE' ? 'bg-orange-100' :
                a.priorite === 'NORMALE' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {TYPE_ICONS[a.type] || '🔔'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-gray-900 ${!a.estLue ? 'text-blue-900' : ''}`}>
                        {a.titre}
                      </h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${prioriteColor(a.priorite)}`}>
                        {a.priorite}
                      </span>
                    </div>
                    {a.commercial && (
                      <p className="text-xs text-blue-500 mt-0.5">{a.commercial.prenom} {a.commercial.nom}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(a.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                {!a.estLue && (
                  <button onClick={() => markRead(a.id)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Marquer comme lu
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
