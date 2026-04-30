'use client'

import { createContext, useContext } from 'react'

export interface Session {
  userId: string
  email: string
  role: string
  commercialId?: string
  nom?: string
  prenom?: string
}

export const SessionContext = createContext<Session | null>(null)

export function useSession() {
  return useContext(SessionContext)
}
