import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import {
  clearSession,
  loadSession,
  notifySession,
  saveSession,
  SESSION_EVENT,
  sessionFromAuth,
} from './session'
import type { RegisterInput, Session } from './types'
import { invalidatePrices } from './hooks'

interface AuthValue {
  session: Session | null
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  useEffect(() => {
    const sync = () => {
      invalidatePrices()
      setSession(loadSession())
    }
    window.addEventListener(SESSION_EVENT, sync)
    return () => window.removeEventListener(SESSION_EVENT, sync)
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const auth = await api.login(email, password)
    saveSession(sessionFromAuth(auth, remember))
    notifySession()
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const auth = await api.register(input)
    saveSession(sessionFromAuth(auth, true))
    notifySession()
  }, [])

  const logout = useCallback(async () => {
    const current = loadSession()
    clearSession()
    notifySession()
    if (current) await api.logout(current.refreshToken).catch(() => { })
  }, [])

  const value = useMemo(() => ({ session, login, register, logout }), [session, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
