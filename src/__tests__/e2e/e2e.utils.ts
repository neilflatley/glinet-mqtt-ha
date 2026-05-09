// Shared utilities for E2E tests.
import { TEST_CONFIG } from './e2e.setup.js'

/**
 * Make a JSON-RPC 2.0 call to the mock router.
 * Mirrors the format the real GlinetController uses.
 */
export async function rpcCall(
  method: string,
  params: unknown,
  id = 0,
): Promise<{ jsonrpc: string; id: number; result?: unknown; error?: { code: number; message: string } }> {
  const res = await fetch(`http://localhost:${TEST_CONFIG.MOCK_ROUTER_PORT}/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
  })
  return res.json()
}

/**
 * Full login flow: challenge → hash → login → return sid.
 */
export async function doLogin(
  username = 'root',
  password = 'test-password',
): Promise<string> {
  // Step 1: challenge
  const challenge = await rpcCall('challenge', { username })
  if (challenge.error) throw new Error(`Challenge failed: ${challenge.error.message}`)

  const { alg, salt, nonce } = (challenge.result as { alg: string; salt: string; nonce: string })

  // Step 2: generate cipher (matching unixpass library)
  // We can't easily replicate unixpass in a utility, so we just return the
  // raw params and let the mock router accept any hash.
  // The mock router accepts any hash for testing.
  const hash = 'mock-hash-for-testing'

  // Step 3: login
  const login = await rpcCall('login', { username, hash })
  if (login.error) throw new Error(`Login failed: ${login.error.message}`)

  return (login.result as { sid: string }).sid
}

/**
 * Make a "call" method request with a valid sid.
 */
export async function rpcCallWithSid(
  sid: string,
  module: string,
  action: string,
  extra?: Record<string, unknown>,
): Promise<unknown> {
  const params = [sid, module, action]
  if (extra) params.push(extra)

  const res = await rpcCall('call', params)
  if (res.error) throw new Error(`RPC call failed: ${res.error.message}`)
  return res.result
}

/**
 * Retry a function with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e as Error
      if (i === maxRetries - 1) break
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** i))
    }
  }
  throw lastError
}

/**
 * Wait for MQTT message on a topic using the mqtt client library.
 */
export function waitForMqttMessage(
  client: ReturnType<typeof import('mqtt').connectAsync>,
  topic: string,
  timeout = 10_000,
): Promise<{ topic: string; payload: Buffer }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for message on ${topic}`)),
      timeout,
    )
    client.once('message', (t, payload) => {
      clearTimeout(timer)
      if (t === topic) resolve({ topic, payload })
    })
  })
}
