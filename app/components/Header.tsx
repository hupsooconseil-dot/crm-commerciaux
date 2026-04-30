'use client'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
  actions?: React.ReactNode
  nom?: string
  prenom?: string
}

export default function Header({ title, subtitle, onMenuClick, actions, nom, prenom }: HeaderProps) {
  const initials = nom && prenom ? `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() : 'U'

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        onClick={onMenuClick}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
      </div>
    </header>
  )
}
