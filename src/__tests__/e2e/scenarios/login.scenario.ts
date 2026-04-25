import { describe, it, expect } from 'vitest'
import { setupE2ETestEnvironment, teardownE2ETestEnvironment, TEST_CONFIG } from '../e2e.setup.js'
import { TestData, E2EUtils } from '../e2e.utils.js'

// Login scenario test
describe('Login Flow Test', () => {
  beforeAll(async () => {
    await setupE2ETestEnvironment()
  })

  afterAll(async () => {
    await teardownE2ETestEnvironment()
  })

  it('should successfully authenticate with mock router', async () => {
    // Mock login API call
    const response = await fetch(`http://localhost:${TEST_CONFIG.MOCK_ROUTER_PORT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    })

    // Validate response
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.code).toBe(0)
    expect(data.message).toBe('success')
  })

  it('should handle authentication failure gracefully', async () => {
    // Configure mock router to return error response
    // Note: This would be done through the MockRouter API in practice
    
    const response = await fetch(`http://localhost:${TEST_CONFIG.MOCK_ROUTER_PORT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'invalid_user',
        password: 'wrong_password'
      })
    })

    // Validate error response
    expect(response.status).toBe(401)
    
    const data = await response.json()
    expect(data.code).toBe(1)
  })
})