// Shared utilities and helpers for E2E tests

// Test data fixtures
export const TestData = {
  // Login response fixture
  loginResponse: {
    code: 0,
    message: "success"
  },
  
  // System status fixture
  systemStatus: {
    "system_info": {
      "sn": "test-serial-12345",
      "model": "GL.iNet GL-MT3000",
      "board_info": {
        "hostname": "gl-mt3000",
        "model": "GL-MT3000",
        "architecture": "armv7l"
      },
      "firmware_version": "3.201.1",
      "hardware_version": "1.0",
      "vendor": "GL.iNet",
      "firmware_type": "stable",
      "mac": "00:11:22:33:44:55",
      "cpu_info": {
        "cpu_count": 2,
        "cpu_model": "ARMv7 Processor rev 4 (v7l)",
        "cpu_speed": "1.4GHz"
      },
      "memory_info": {
        "total_memory": 512,
        "free_memory": 300,
        "used_memory": 212
      }
    },
    "uptime": 123456789,
    "load_average": [0.1, 0.2, 0.3],
    "network_info": {
      "wan_ipv4": "192.168.1.100",
      "wan_ipv6": "::1",
      "lan_ipv4": "192.168.8.1",
      "lan_ipv6": "::1"
    }
  },
  
  // Modem status fixture
  modemStatus: {
    "modem_status": {
      "connection_type": "4G",
      "signal": {
        "rssi": -70,
        "rsrq": -9,
        "sinr": 12,
        "band": 3,
        "earfcn": 1000
      },
      "operator": "Test Provider",
      "imei": "123456789012345",
      "imsi": "123456789012345",
      "apn": "test.apn",
      "roaming": false,
      "network_type": "LTE"
    },
    "connection_state": "connected"
  },
  
  // Location fixture
  locationStatus: {
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "accuracy": 50,
      "altitude": 10,
      "speed": 0,
      "course": 0
    }
  },
  
  // Status fixture
  routerStatus: {
    "status": {
      "cpu_usage": 15,
      "memory_usage": 40,
      "wan_status": "connected",
      "lan_status": "connected",
      "wireless_status": "connected"
    }
  }
}

// Utility functions for E2E testing
export const E2EUtils = {
  // Helper function to validate response data structure
  validateResponseStructure: (response: any, expectedFields: string[]) => {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response data')
    }
    
    for (const field of expectedFields) {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return true
  },
  
  // Helper function to create test scenarios
  createTestScenario: (name: string, setup: () => Promise<void>, execute: () => Promise<void>) => {
    return {
      name,
      setup,
      execute
    }
  },
  
  // Helper for retry logic with exponential backoff
  retryWithBackoff: async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
    let lastError: Error
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (i === maxRetries - 1) break
        
        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
}