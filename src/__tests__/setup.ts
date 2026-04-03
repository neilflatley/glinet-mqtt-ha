import { beforeAll, afterAll } from 'vitest';
import { setTimeout as sleep } from 'timers/promises';

const originalEnv = { ...process.env };

beforeAll(() => {
  process.env.GLINET_API = 'false';
  process.env.MQTT_HOST = '';
  process.env.GLINET_HOST = 'mock-router.local';
  process.env.GLINET_PASSWORD = 'mock-password';
  
  // Mock external dependencies that need to be mocked
  // This is needed for the integration tests
});

afterAll(() => {
  process.env = originalEnv;
});
