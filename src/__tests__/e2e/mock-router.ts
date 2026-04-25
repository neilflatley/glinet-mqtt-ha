import { createServer } from 'http'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// Mock router server for E2E testing
export class MockRouter {
  port: number
  server: any
  routes: Map<string, (req: any, res: any) => void>
  config: Record<string, any>

  constructor() {
    this.port = 8080
    this.server = null
    this.routes = new Map()
    this.config = {}
    this.setupDefaultRoutes()
  }

  setupDefaultRoutes() {
    // Setup basic routes with mock data
    this.routes.set('/login', this.handleLogin.bind(this))
    this.routes.set('/api/status', this.handleStatus.bind(this))
    this.routes.set('/api/system', this.handleSystem.bind(this))
    this.routes.set('/api/modem', this.handleModem.bind(this))
    this.routes.set('/api/location', this.handleLocation.bind(this))
  }

  // Load configuration from file
  loadConfig(configPath: string = './config/mock-router-config.json') {
    try {
      const configData = readFileSync(join(__dirname, configPath), 'utf8')
      this.config = JSON.parse(configData)
    } catch {
      console.log('No config file found, using default configuration')
      this.config = {}
    }
  }

  // Set response for a specific route
  setRouteResponse(route: string, response: any) {
    this.config[route] = response
  }

  // Save current configuration to file
  saveConfig(configPath: string = './config/mock-router-config.json') {
    try {
      writeFileSync(join(__dirname, configPath), JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save mock router config:', error)
    }
  }

  handleLogin(req: any, res: any) {
    // Check if there's a configured response for login
    if (this.config['/login']) {
      const response = this.config['/login']
      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response.body))
      return
    }
    
    // Default login response
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      code: 0,
      message: 'success'
    }))
  }

  handleStatus(req: any, res: any) {
    // Check if there's a configured response for status
    if (this.config['/api/status']) {
      const response = this.config['/api/status']
      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response.body))
      return
    }
    
    // Default status response using fixtures
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(readFileSync(join(__dirname, 'mock-router/fixtures/status.json'), 'utf8'))
  }

  handleSystem(req: any, res: any) {
    // Check if there's a configured response for system
    if (this.config['/api/system']) {
      const response = this.config['/api/system']
      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response.body))
      return
    }
    
    // Default system response using fixtures
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(readFileSync(join(__dirname, 'mock-router/fixtures/system.json'), 'utf8'))
  }

  handleModem(req: any, res: any) {
    // Check if there's a configured response for modem
    if (this.config['/api/modem']) {
      const response = this.config['/api/modem']
      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response.body))
      return
    }
    
    // Default modem response using fixtures
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(readFileSync(join(__dirname, 'mock-router/fixtures/modem.json'), 'utf8'))
  }

  handleLocation(req: any, res: any) {
    // Check if there's a configured response for location
    if (this.config['/api/location']) {
      const response = this.config['/api/location']
      res.writeHead(response.status || 200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response.body))
      return
    }
    
    // Default location response using fixtures
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(readFileSync(join(__dirname, 'mock-router/fixtures/location.json'), 'utf8'))
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req: any, res: any) => {
        const routeHandler = this.routes.get(req.url)
        if (routeHandler) {
          routeHandler(req, res)
        } else {
          res.writeHead(404)
          res.end('Not Found')
        }
      })

      this.server.listen(this.port, () => {
        console.log(`Mock router server listening on port ${this.port}`)
        resolve()
      })

      this.server.on('error', reject)
    })
  }

  stop() {
    if (this.server) {
      this.server.close()
    }
  }
}
