import { describe, it, expect, beforeAll } from 'vitest'
import { doLogin, rpcCallWithSid } from '../e2e.utils'

describe('Refresh Cycle', () => {
  let sid: string

  beforeAll(async () => {
    sid = await doLogin()
  })

  it('should get system info', async () => {
    const result = await rpcCallWithSid(sid, 'system', 'get_info')
    expect(result).toBeDefined()
    const info = result as Record<string, unknown>
    expect(info).toHaveProperty('model')
    expect(info).toHaveProperty('sn')
    expect(info).toHaveProperty('firmware_version')
  })

  it('should get system status', async () => {
    const result = await rpcCallWithSid(sid, 'system', 'get_status')
    expect(result).toBeDefined()
    const status = result as Record<string, unknown>
    expect(status).toHaveProperty('network')
    expect(status).toHaveProperty('system')
  })

  it('should get modem info', async () => {
    const result = await rpcCallWithSid(sid, 'modem', 'get_info')
    expect(result).toBeDefined()
    const info = result as Record<string, unknown>
    expect(info).toHaveProperty('modems')
  })

  it('should get modem status', async () => {
    const result = await rpcCallWithSid(sid, 'modem', 'get_status')
    expect(result).toBeDefined()
    const status = result as Record<string, unknown>
    expect(status).toHaveProperty('modems')
  })

  it('should get cells info', async () => {
    const result = await rpcCallWithSid(sid, 'modem', 'get_cells_info')
    expect(result).toBeDefined()
    const cells = result as { cells: unknown[] }
    expect(cells.cells).toBeInstanceOf(Array)
    expect(cells.cells.length).toBeGreaterThan(0)
  })

  it('should get SMS list', async () => {
    const result = await rpcCallWithSid(sid, 'modem', 'get_sms_list')
    expect(result).toBeDefined()
    const sms = result as { list: unknown[] }
    expect(sms.list).toBeInstanceOf(Array)
  })

  it('should handle AT commands', async () => {
    const atResult = await rpcCallWithSid(
      sid,
      'modem',
      'send_at_command',
      { command: 'AT+QNWINFO' },
    )
    expect(atResult).toBeDefined()
    const resp = atResult as { response: string }
    expect(resp.response).toContain('OK')
  })

  it('should send SMS', async () => {
    const smsResult = await rpcCallWithSid(
      sid,
      'modem',
      'send_sms',
      { body: 'test message', phone_number: '+1234567890' },
    )
    expect(smsResult).toBeDefined()
    const resp = smsResult as { success: boolean }
    expect(resp.success).toBe(true)
  })

  it('should reboot (returns success, router would actually restart)', async () => {
    const result = await rpcCallWithSid(sid, 'system', 'reboot')
    expect(result).toBeDefined()
    const resp = result as { message: string }
    expect(resp.message).toBe('rebooting')
  })
})
