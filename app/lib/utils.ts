import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
}

export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

export function statutColor(statut: string): string {
  const map: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800',
    INACTIF: 'bg-gray-100 text-gray-800',
    OFFBOARDE: 'bg-red-100 text-red-800',
    NOUVEAU: 'bg-blue-100 text-blue-800',
    CONTACTE: 'bg-yellow-100 text-yellow-800',
    RDV_PRIS: 'bg-purple-100 text-purple-800',
    DEVIS_ENVOYE: 'bg-orange-100 text-orange-800',
    GAGNE: 'bg-green-100 text-green-800',
    PERDU: 'bg-red-100 text-red-800',
    EN_COURS: 'bg-blue-100 text-blue-800',
    VALIDE: 'bg-green-100 text-green-800',
    EXPIRE: 'bg-red-100 text-red-800',
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    MANQUANT: 'bg-red-100 text-red-800',
    PAYEE: 'bg-green-100 text-green-800',
    LITIGE: 'bg-red-100 text-red-800',
    TERMINE: 'bg-green-100 text-green-800',
    NON_COMMENCE: 'bg-gray-100 text-gray-800',
  }
  return map[statut] || 'bg-gray-100 text-gray-800'
}

export function prioriteColor(priorite: string): string {
  const map: Record<string, string> = {
    BASSE: 'bg-gray-100 text-gray-700',
    NORMALE: 'bg-blue-100 text-blue-700',
    HAUTE: 'bg-orange-100 text-orange-700',
    CRITIQUE: 'bg-red-100 text-red-700',
  }
  return map[priorite] || 'bg-gray-100 text-gray-700'
}

export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function generateRef(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CTR-${year}${month}-${rand}`
}
