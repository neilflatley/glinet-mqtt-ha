// E2E test setup and configuration
import { beforeAll, afterAll } from 'vitest'
import { MockRouter } from './mock-router.js'

// Global test configuration
export const TEST_CONFIG = {
  MOCK_ROUTER_PORT: 8080,
  MQTT_BROKER_URL: 'mqtt://localhost:1884',
  TEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
}

// Global variables for test environment
export let mockRouter: MockRouter | null = null

// Setup function to initialize test environment
export async function setupE2ETestEnvironment() {
  // Start mock router
  mockRouter = new MockRouter()
  await mockRouter.start()
  
  console.log('E2E test environment initialized')
}

// Teardown function to clean up test environment
export async function teardownE2ETestEnvironment() {
  if (mockRouter) {
    mockRouter.stop()
    mockRouter = null
  }
  
  console.log('E2E test environment cleaned up')
}

// Test utilities
export const E2EUtils = {
  // Helper to create test data fixtures
  createTestData: (data: Record<string, any>) => {
    return data
  },
  
  // Helper to validate API responses
  validateApiResponse: (response: any) => {
    return response && typeof response === 'object'
  },
  
  // Helper for retry logic
  retry: async <T>(fn: () => Promise<T>, attempts: number = 3): Promise<T> => {
    let lastError: Error | undefined
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i === attempts - 1) break
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (lastError) {
      throw lastError
    }
    throw new Error('Retry failed with no error')
  }
}