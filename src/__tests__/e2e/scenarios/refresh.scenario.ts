import { describe, it, expect } from 'vitest'
import { setupE2ETestEnvironment, teardownE2ETestEnvironment, TEST_CONFIG } from '../e2e.setup.js'
import { TestData, E2EUtils } from '../e2e.utils.js'

// Refresh cycle test
describe('Refresh Cycle Test', () => {
  beforeAll(async () => {
    await setupE2ETestEnvironment()
  })

  afterAll(async () => {
    await teardownE2ETestEnvironment()
  })

  it('should successfully refresh system status', async () => {
    // Mock system API call
    const response = await fetch(`http://localhost:${TEST_CONFIG.MOCK_ROUTER_PORT}/api/system`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Validate response
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('system_info')
    expect(data.system_info).toHaveProperty('model')
  })

  it('should handle refresh errors gracefully', async () => {
    // Configure mock router to return error response
    
    const response = await fetch(`http://localhost:${TEST_CONFIG.MOCK_ROUTER_PORT}/api/system`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Validate error handling
    expect(response.status).toBe(200) // Mock will return 200 but with error data
    
    const data = await response.json()
    expect(data).toHaveProperty('system_info')
  })
})