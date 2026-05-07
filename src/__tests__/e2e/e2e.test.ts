// E2E test entrypoint — registers setup/teardown and imports all scenario files.
// Running this file (or `npm run test:e2e`) runs ALL E2E scenarios with one
// shared mock router and MQTT broker lifecycle.
import { beforeAll, afterAll } from 'vitest'
import { setupE2ETestEnvironment, teardownE2ETestEnvironment } from './e2e.setup.js'

// Register lifecycle hooks once
beforeAll(setupE2ETestEnvironment, 60_000)
afterAll(teardownE2ETestEnvironment)

// Import all scenario files — Vitest will discover their describe/it blocks
import './scenarios/login.test.ts'
import './scenarios/refresh.test.ts'
import './scenarios/mqtt.test.ts'
import './scenarios/error.test.ts'
