import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Fixture loader ──────────────────────────────────────────────────────────

function loadFixture(name: string): unknown {
  try {
    return JSON.parse(
      readFileSync(join(__dirname, 'mock-router', 'fixtures', `${name}.json`), 'utf8'),
    )
  } catch {
    return {}
  }
}

// ── JSON-RPC response helpers ───────────────────────────────────────────────

function ok(id: number, result: unknown): string {
  return JSON.stringify({ jsonrpc: '2.0', id, result })
}

function err(id: number, code: number, message: string, data?: unknown): string {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message, data } })
}

// ── Challenge / Login state ─────────────────────────────────────────────────

let challengeState: { salt: string; nonce: string; alg: string } | null = null
let validSid: string | null = null

// ── Route handler ───────────────────────────────────────────────────────────

function handleRpc(req: IncomingMessage, res: ServerResponse): void {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
    if (body.length > 1_000_000) {
      // 1 MB guard
      res.writeHead(413)
      res.end('too big')
      req.destroy()
      return
    }
  })
  req.on('end', () => {
    let parsed: { jsonrpc?: string; method?: string; params?: unknown; id?: number }
    try {
      parsed = JSON.parse(body)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(err(0, -32700, 'Parse error'))
      return
    }

    const { jsonrpc, method, params, id } = parsed
    if (jsonrpc !== '2.0') {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(err(id ?? 0, -32600, 'Invalid JSON-RPC version'))
      return
    }

    let response: string

    switch (method) {
      // ── Auth flow ────────────────────────────────────────────────────

      case 'challenge': {
        // params: { username: string }
        const u = (params as { username?: string })?.username
        if (!u) {
          response = err(id ?? 0, -32602, 'Invalid params')
          break
        }
        challengeState = {
          alg: 'sha256',
          salt: 'mocksalt123456',
          nonce: 'mocknonce789',
        }
        response = ok(id ?? 0, challengeState)
        break
      }

      case 'login': {
        // params: { username: string, hash: string }
        const p = params as { username?: string; hash?: string }
        if (!p?.username || !p?.hash) {
          response = err(id ?? 0, -32602, 'Invalid params')
          break
        }
        // Accept any hash for testing (real router validates against challenge)
        if (!validSid) {
          validSid = 'mock-session-id-' + Math.random().toString(36).slice(2, 10)
        }
        response = ok(id ?? 0, { sid: validSid })
        break
      }

      case 'logout': {
        validSid = null
        challengeState = null
        response = ok(id ?? 0, null)
        break
      }

      // ── Module dispatch (call method) ────────────────────────────────

      case 'call': {
        // params: [sid, module, action, ...extraArgs]
        const callParams = params as unknown[]
        if (!Array.isArray(callParams) || callParams.length < 3) {
          response = err(id ?? 0, -32602, 'Invalid params')
          break
        }
        const [, module, action] = callParams as [string, string, string]

        // Validate session for stateful calls
        if (module !== 'system' && module !== 'modem') {
          response = err(id ?? 0, -32601, `Method not found: ${module}/${action}`)
          break
        }

        switch (`${module}/${action}`) {
          // system.get_info
          case 'system/get_info': {
            const fixture = loadFixture('system')
            response = ok(id ?? 0, fixture)
            break
          }

          // system.get_status
          case 'system/get_status': {
            const fixture = loadFixture('status')
            response = ok(id ?? 0, fixture)
            break
          }

          // system.reboot
          case 'system/reboot': {
            response = ok(id ?? 0, { message: 'rebooting' })
            break
          }

          // modem.get_info
          case 'modem/get_info': {
            const fixture = loadFixture('modem')
            response = ok(id ?? 0, fixture)
            break
          }

          // modem.get_status
          case 'modem/get_status': {
            const fixture = loadFixture('modem')
            response = ok(id ?? 0, fixture)
            break
          }

          // modem.get_cells_info
          case 'modem/get_cells_info': {
            response = ok(id ?? 0, {
              cells: [
                {
                  id: '3456',
                  band: 3,
                  type: 'LTE',
                  rssi: -75,
                  rsrp: -95,
                  rsrq: -10,
                  sinr: 12,
                  rssi_level: 3,
                  rsrp_level: 3,
                  rsrq_level: 3,
                  sinr_level: 4,
                  mode: 'FDD',
                  tx_channel: '1000',
                  dl_bandwidth: '20MHz',
                  ul_bandwidth: '20MHz',
                },
              ],
            })
            break
          }

          // modem.get_sms_list
          case 'modem/get_sms_list': {
            response = ok(id ?? 0, {
              list: [
                {
                  phone_number: '+1234567890',
                  type: 1,
                  name: 'Test Sender',
                  date: '2024-01-15 10:30:00',
                  bus: '0001:01:00.0',
                  status: 0,
                  body: 'Test SMS message',
                },
              ],
            })
            break
          }

          // modem.send_at_command
          case 'modem/send_at_command': {
            const extra = callParams[3] as { command?: string } | undefined
            const cmd = extra?.command ?? ''
            if (cmd === 'AT+QNWINFO') {
              response = ok(id ?? 0, { response: '\r\n+QNWINFO: "FDD LTE","23430","LTE BAND 3",1617\r\n+QNWINFO: "FDD NR5G","23430","NR5G BAND 28",156510\r\n\r\nOK\r\n' })
            } else if (cmd === 'AT+CEREG?') {
              response = ok(id ?? 0, { response: '\r\n+CEREG?: 1,1,"1A2B","00345678",7\r\n\r\nOK\r\n' })
            } else {
              response = ok(id ?? 0, { response: 'OK' })
            }
            break
          }

          // modem.send_sms
          case 'modem/send_sms': {
            const smsParams = callParams[3] as { body?: string; phone_number?: string } | undefined
            response = ok(id ?? 0, {
              success: true,
              message_id: 'msg-' + Math.random().toString(36).slice(2, 8),
              ...smsParams,
            })
            break
          }

          default:
            response = err(id ?? 0, -32601, `Method not found: ${module}/${action}`)
        }
        break
      }

      // ── Unknown method ───────────────────────────────────────────────

      default:
        response = err(id ?? 0, -32601, `Method not found: ${method}`)
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(response)
  })
}

// ── Singleton instance ──────────────────────────────────────────────────────

let _instance: MockRouter | null = null

export function getMockRouter(): MockRouter | null {
  return _instance
}

// ── Server ──────────────────────────────────────────────────────────────────

export class MockRouter {
  private server: ReturnType<typeof createServer> | null = null
  private _port = 8080

  constructor(port?: number) {
    if (port) this._port = port
  }

  get port(): number {
    return this._port
  }

  /**
   * Start the mock router. Only one instance can be running at a time.
   * If another instance is already listening on this port, resolves immediately.
   */
  start(): Promise<void> {
    // If another instance is already running on this port, skip
    if (_instance && _instance.server && _instance._port === this._port) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(handleRpc)
      this.server.listen(this._port, () => {
        console.log(`[mock-router] listening on port ${this._port}`)
        _instance = this
        resolve()
      })
      this.server.on('error', (err: NodeJS.ErrnoException) => {
        // Port already in use — another instance is running
        if (err.code === 'EADDRINUSE') {
          console.log(`[mock-router] port ${this._port} already in use, reusing existing instance`)
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[mock-router] stopped')
          this.server = null
          if (_instance === this) _instance = null
        })
      }
      resolve()
    })
  }

  /** Reset auth state (useful between test cases) */
  resetAuth(): void {
    challengeState = null
    validSid = null
  }
}
