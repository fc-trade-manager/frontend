import type { AuthResponse, Session } from './types'

const KEY = 'fc.session'
export const SESSION_EVENT = 'fc:session'

// "Keep me signed in" decides where the session goes
export function loadSession(): Session | null {
  for (const store of [localStorage, sessionStorage]) { // localStorage survives a browser restart, sessionStorage does not.
    try {
      const raw = store.getItem(KEY)
      if (raw) return JSON.parse(raw) as Session
    } catch {
      // storage unavailable or corrupted: treat as signed out
    }
  }
  return null
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
  }
}

export function saveSession(session: Session): void {
  clearSession()
  try {
    ;(session.remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session))
  } catch {
  }
}

export function notifySession(): void {
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function sessionFromAuth(auth: AuthResponse, remember: boolean): Session {
  return {
    token: auth.token,
    refreshToken: auth.refreshToken,
    expiresAt: auth.expiresAt,
    remember,
    user: {
      id: auth.userId,
      email: auth.email,
      username: auth.username,
      displayName: auth.displayName,
    },
  }
}
