import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, loadSession, saveSession, sessionFromAuth } from './session'

const auth = {
  userId: 'u1',
  email: 'me@test.com',
  username: 'me_trader',
  displayName: 'Me Trader',
  token: 'jwt',
  refreshToken: 'refresh',
  expiresAt: '2026-01-01T10:15:00Z',
}

describe('session storage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('keeps the session in localStorage only when "keep me signed in" is on', () => {
    saveSession(sessionFromAuth(auth, true))
    expect(localStorage.getItem('fc.session')).not.toBeNull()
    expect(sessionStorage.getItem('fc.session')).toBeNull()

    saveSession(sessionFromAuth(auth, false)) // replaces the previous one
    expect(localStorage.getItem('fc.session')).toBeNull()
    expect(sessionStorage.getItem('fc.session')).not.toBeNull()
  })

  it('loads the saved session, clears it, and treats corrupted data as signed out', () => {
    saveSession(sessionFromAuth(auth, true))
    expect(loadSession()).toMatchObject({ token: 'jwt', refreshToken: 'refresh', user: { id: 'u1', username: 'me_trader' } })

    clearSession()
    expect(loadSession()).toBeNull()

    localStorage.setItem('fc.session', '{not json')
    expect(loadSession()).toBeNull()
  })
})
