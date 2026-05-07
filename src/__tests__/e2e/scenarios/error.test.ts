import { describe, it, expect } from 'vitest'
import { rpcCall, rpcCallWithSid } from '../e2e.utils'

describe('Error Handling', () => {
  it('should reject invalid JSON-RPC method', async () => {
    const res = await rpcCall('nonexistent_method', null)
    expect(res.error).toBeDefined()
    expect(res.error!.code).toBe(-32601)
    expect(res.error!.message).toContain('Method not found')
  })

  it('should reject call with missing params', async () => {
    const res = await rpcCall('call', null)
    expect(res.error).toBeDefined()
    expect(res.error!.code).toBe(-32602)
  })

  it('should reject malformed request body', async () => {
    const res = await fetch('http://localhost:8080/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    expect(res.status).toBe(400)
  })

  it('should reject invalid JSON-RPC version', async () => {
    const rawRes = await fetch('http://localhost:8080/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '1.0', method: 'challenge', params: {}, id: 0 }),
    })
    const body = await rawRes.json()
    expect(body.error).toBeDefined()
    expect(body.error!.code).toBe(-32600)
  })

  it('should handle unknown module/action in call', async () => {
    const loginRes = await rpcCall('login', { username: 'root', hash: 'test' })
    const sid = (loginRes.result as { sid: string }).sid

    const res = await rpcCall('call', [sid, 'unknown_module', 'unknown_action'])
    expect(res.error).toBeDefined()
    expect(res.error!.code).toBe(-32601)
  })

  it('should handle unknown method in call params', async () => {
    const loginRes = await rpcCall('login', { username: 'root', hash: 'test' })
    const sid = (loginRes.result as { sid: string }).sid

    const res = await rpcCall('call', [sid, 'system', 'nonexistent_action'])
    expect(res.error).toBeDefined()
    expect(res.error!.code).toBe(-32601)
  })
})
