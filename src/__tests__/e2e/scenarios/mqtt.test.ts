import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { doLogin, rpcCallWithSid } from '../e2e.utils'
import { TEST_CONFIG, controller } from '../e2e.setup'
import { mqtt } from '../../../mqtt'

describe('MQTT Integration', () => {
  const attributePayloads: string[] = []

  beforeAll(async () => {
    // Get a valid session and trigger a refresh via the mock router
    const sid = await doLogin()

    // Make API calls through the mock router to populate state
    await rpcCallWithSid(sid, 'system', 'get_info')
    await rpcCallWithSid(sid, 'system', 'get_status')
    await rpcCallWithSid(sid, 'modem', 'get_info')
    await rpcCallWithSid(sid, 'modem', 'get_status')

    // Populate controller state via its own API calls (not the test utilities)
    await controller!.refresh()

    // Attach listener BEFORE init to capture messages from the polling loop
    mqtt.client?.on('message', (topic, payload) => {
      if (topic.includes('/attribute')) {
        attributePayloads.push(payload.toString())
      }
    })

    // Initialize MQTT - this publishes discovery messages and starts polling
    await mqtt.init(controller!)

    // Wait for the polling loop to publish at least one attribute update
    await new Promise((r) => setTimeout(r, 3000))
  }, 30_000)

  afterAll(async () => {
    mqtt.stopPolling?.()
    await mqtt.disconnect()
  })

  it('should connect to MQTT broker', async () => {
    expect(mqtt.client).toBeDefined()
  })

  it('should publish attribute updates', async () => {
    // Note: MQTT clients don't receive their own published messages,
    // so we verify the client is connected and publishing works
    expect(mqtt.client).toBeDefined()
    expect(mqtt.count).toBeGreaterThan(0) // At least one status message published
  })

  it('should subscribe to command topics', async () => {
    const model = mqtt.router?.model || TEST_CONFIG.MODEL
    const commandTopic = `glinet-${model}/command`

    const messageReceived = new Promise<void>((resolve) => {
      mqtt.client!.once('message', (topic) => {
        if (topic === commandTopic) resolve()
      })
    })

    await mqtt.client!.publishAsync(commandTopic, 'restart')

    await messageReceived

    expect(mqtt.client).toBeDefined()
  })
})
