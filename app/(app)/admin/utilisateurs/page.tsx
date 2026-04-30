'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/components/SessionContext'

const ROLES = [
  { value: 'COMMERCIAL', label: 'Commercial', icon: '👤', desc: 'Accès à ses propres données uniquement' },
  { value: 'CHEF_EQUIPE', label: 'Chef d\'équipe', icon: '👥', desc: 'Accès aux données de son équipe' },
  { value: 'CHEF_RESEAU', label: 'Chef de réseau', icon: '🌐', desc: 'Accès à l\'ensemble de son réseau' },
  { value: 'MANAGER', label: 'Manager', icon: '🎯', desc: 'Accès complet en lecture/écriture' },
  { value: 'ADMIN', label: 'Administrateur', icon: '⚙️', desc: 'Accès total y compris gestion des utilisateurs' },
]

const ROLE_COLORS: Record<string, string> = {
  COMMERCIAL: 'bg-gray-100 text-gray-700',
  CHEF_EQUIPE: 'bg-blue-100 text-blue-700',
  CHEF_RESEAU: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-red-100 text-red-700',
}

export default function UtilisateursPage() {
  const session = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [equipes, setEquipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', userRole: 'COMMERCIAL',
    nom: '', prenom: '', telephone: '', region: '', equipeId: ''
  })
  const [search, setSearch] = useState('')

  const load = () => {
    Promise.all([
      fetch('/api/admin/utilisateurs').then(r => r.json()),
      fetch('/api/equipes').then(r => r.json()),
    ]).then(([u, e]) => {
      setUsers(Array.isArray(u) ? u : [])
      setEquipes(Array.isArray(e) ? e : [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditUser(null)
    setForm({ email: '', password: '', userRole: 'COMMERCIAL', nom: '', prenom: '', telephone: '', region: '', equipeId: '' })
    setShowForm(true)
  }

  function openEdit(user: any) {
    setEditUser(user)
    setForm({
      email: user.email,
      password: '',
      userRole: user.role,
      nom: user.commercial?.nom || '',
      prenom: user.commercial?.prenom || '',
      telephone: user.commercial?.telephone || '',
      region: user.commercial?.region || '',
      equipeId: user.commercial?.equipeId || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editUser) {
      await fetch(`/api/admin/utilisateurs/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/admin/utilisateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteUser(id: string, email: string) {
    if (email === 'admin@crm.fr') return alert('Impossible de supprimer le compte admin principal.')
    if (!confirm(`Supprimer l'utilisateur ${email} ? Cette action est irréversible.`)) return
    await fetch(`/api/admin/utilisateurs/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.commercial?.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.commercial?.prenom || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500">{users.length} compte{users.length !== 1 ? 's' : ''} créé{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Créer un compte
        </button>
      </div>

      {/* Rôles expliqués */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="text-xl mb-1">{r.icon}</div>
            <p className="text-xs font-semibold text-gray-800">{r.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Utilisateur</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rôle</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Équipe</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Région</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Aucun utilisateur</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.commercial?.prenom?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.commercial?.prenom} {u.commercial?.nom}
                          </p>
                          <p className="text-xs text-gray-400">{u.commercial?.statut || 'ACTIF'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLES.find(r => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {u.commercial?.equipe?.nom || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {u.commercial?.region || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium">
                          Modifier
                        </button>
                        <button onClick={() => deleteUser(u.id, u.email)}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold">{editUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
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
                    disabled={!!editUser}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mot de passe {editUser && <span className="text-gray-400">(laisser vide pour ne pas changer)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editUser}
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={editUser ? 'Nouveau mot de passe (optionnel)' : 'Minimum 8 caractères'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rôle</label>
                  <div className="grid grid-cols-1 gap-2">
                    {ROLES.map(r => (
                      <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        form.userRole === r.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input type="radio" name="role" value={r.value} checked={form.userRole === r.value}
                          onChange={e => setForm({...form, userRole: e.target.value})} className="sr-only" />
                        <span className="text-xl">{r.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${form.userRole === r.value ? 'text-blue-700' : 'text-gray-800'}`}>{r.label}</p>
                          <p className="text-xs text-gray-500">{r.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
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
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Équipe</label>
                  <select value={form.equipeId} onChange={e => setForm({...form, equipeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Aucune équipe</option>
                    {equipes.map((eq: any) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nom}{eq.reseau ? ` (${eq.reseau.nom})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Enregistrement...' : editUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
