// E2E test setup — starts MockRouter and configures env.
// This file should only be imported by e2e.test.ts (the main entrypoint).
// Individual scenario files should NOT import this file's hooks.
import { beforeAll, afterAll } from 'vitest'
import { MockRouter } from './mock-router.js'
import GlinetController from '../../controller.js'
import { mqtt } from '../../mqtt.js'

export const TEST_CONFIG = {
  MOCK_ROUTER_PORT: 8080,
  MQTT_BROKER_URL: process.env.MQTT_HOST || 'mqtt://172.18.0.1:1884',
  MQTT_REFRESH: 2, // seconds (short for tests)
  MODEL: 'GL-MT3000',
}

let mockRouter: MockRouter | null = null
let controller: GlinetController | null = null

/**
 * Start the mock router, set env vars, create controller.
 */
export async function setupE2ETestEnvironment() {
  mockRouter = new MockRouter(TEST_CONFIG.MOCK_ROUTER_PORT)
  await mockRouter.start()

  process.env.GLINET_HOST = `localhost:${TEST_CONFIG.MOCK_ROUTER_PORT}`
  process.env.GLINET_PASSWORD = 'test-password'
  process.env.MQTT_REFRESH = String(TEST_CONFIG.MQTT_REFRESH)
  process.env.GLINET_API = 'false'
  if (!process.env.MQTT_HOST) {
    process.env.MQTT_HOST = TEST_CONFIG.MQTT_BROKER_URL
  }

  controller = new GlinetController(
    process.env.GLINET_HOST!,
    process.env.GLINET_PASSWORD!,
  )

  console.log('[e2e-setup] mock router started on port', TEST_CONFIG.MOCK_ROUTER_PORT)
}

/**
 * Tear down: disconnect MQTT, stop mock router, clean env.
 */
export async function teardownE2ETestEnvironment() {
  if (mqtt.stopPolling) mqtt.stopPolling()
  await mqtt.disconnect()

  if (mockRouter) {
    await mockRouter.stop()
    mockRouter = null
  }

  delete process.env.GLINET_HOST
  delete process.env.GLINET_PASSWORD
  delete process.env.MQTT_HOST
  delete process.env.MQTT_REFRESH
  delete process.env.GLINET_API

  console.log('[e2e-setup] cleaned up')
}

export { controller }
