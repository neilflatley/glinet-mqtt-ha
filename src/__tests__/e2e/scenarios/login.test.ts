import { describe, it, expect, beforeAll } from 'vitest'
import { doLogin, rpcCall } from '../e2e.utils'

describe('Login Flow', () => {
  it('should return a sid from the challenge → login flow', async () => {
    const sid = await doLogin()
    expect(sid).toBeDefined()
    expect(typeof sid).toBe('string')
    expect(sid).toMatch(/^mock-session-id-/)
  })

  it('should accept any hash in the login step', async () => {
    const res = await rpcCall('login', { username: 'root', hash: 'any-hash' })
    expect(res.error).toBeUndefined()
    expect(res.result).toHaveProperty('sid')
  })

  it('should reject login with missing params', async () => {
    const res = await rpcCall('login', {})
    expect(res.error).toBeDefined()
    expect(res.error!.code).toBe(-32602)
  })

  it('should invalidate session on logout', async () => {
    const sid = await doLogin()
    expect(sid).toBeDefined()

    const logout = await rpcCall('logout', null)
    expect(logout.error).toBeUndefined()

    const sid2 = await doLogin()
    expect(sid2).not.toBe(sid)
  })
})
