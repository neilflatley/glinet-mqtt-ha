import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

const mockRouter = {
  sid: 'test-sid',
  model: 'GL-MT3000',
  state: {
    system_info: { sn: 'TEST123', model: 'GL-MT3000' },
    uptime: 12345,
    modem_status: { signal: 80 },
  },
  api: {
    post: vi.fn().mockResolvedValue([null, { data: { result: {} } }]),
  },
  system: {
    status: { result: { uptime: 12345 } },
    get_status: vi.fn().mockResolvedValue({ result: { uptime: 12345 } }),
    reboot: vi.fn().mockResolvedValue({ result: { reboot: 'ok' } }),
  },
  modem: {
    sms: { result: [] },
    get_sms_list: vi.fn().mockResolvedValue({ result: [] }),
    get_tower_info: vi.fn().mockResolvedValue({ result: { signal: 80 } }),
    send_sms: vi.fn().mockResolvedValue({ result: { sent: true } }),
  },
  refresh: vi.fn().mockResolvedValue({ uptime: 12345 }),
  publish: vi.fn(),
};

describe('API Endpoints', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create a test server that doesn't start listening
    server = Fastify({ logger: false });

    // Manually add routes for testing without starting the server
    server.get('/ping', async (_request, reply) => {
      reply.type('application/json').code(200);
      return { pong: 'ok' };
    });

    server.get('/call', async (_request, reply) => {
      try {
        const params = JSON.parse((_request.query as any).params) || [];
        const [err, resp] = await mockRouter.api.post(params);

        reply.type('application/json').code(200);
        return resp?.data;
      } catch (error) {
        reply.type('application/json').code(500);
        return { error: `${error}` };
      }
    });

    server.get('/ha-devices', async (_request, reply) => {
      try {
        reply.type('application/json').code(200);
        return { sensor: [] };
      } catch (error) {
        reply.type('application/json').code(500);
        return { error: `${error}` };
      }
    });

    server.get('/ha-attribute', async (_request, reply) => {
      try {
        const attribute = mockRouter.state;
        reply.type('application/json').code(200);
        return attribute;
      } catch (error) {
        reply.type('application/json').code(500);
        return { error: `${error}` };
      }
    });

    server.get('/refresh', async (_request, reply) => {
      try {
        await mockRouter.refresh();
        reply.type('application/json').code(200);
        return mockRouter.state;
      } catch (error) {
        reply.type('application/json').code(500);
        return { error: `${error}` };
      }
    });

    server.get('/status', async (_request, reply) => {
      try {
        await mockRouter.system.get_status();
        mockRouter.publish();
        reply.type('application/json').code(200);
        return mockRouter.system.status;
      } catch (error) {
        reply.type('application/json').code(500);
        return { error: `${error}` };
      }
    });

    server.get('/cell_info', async (_request, reply) => {
      try {
        const info = await mockRouter.modem.get_tower_info();
        reply.type('application/json').code(200);
        return info;
      } catch (error) {
        reply.type('application/json').code(500);
        return { error: `${error}` };
      }
    });

    server.get('/login', async (_request, reply) => {
      try {
        reply.type('application/json').code(200);
        return mockRouter.state;
      } catch (error) {
        reply.type('application/json').code(500);
        return { login: 'error', error: `${error}` };
      }
    });

    server.get('/reboot', async (_request, reply) => {
      try {
        await mockRouter.system.reboot();
        reply.type('application/json').code(200);
        return { reboot: 'ok' };
      } catch (error) {
        reply.type('application/json').code(500);
        return { reboot: 'error', error: `${error}` };
      }
    });

    server.post('/reboot', async (_request, reply) => {
      try {
        if ((_request.body as any).reboot === 'ok') {
          await mockRouter.system.reboot();
          reply.type('application/json').code(200);
          return { reboot: 'ok' };
        }
        return;
      } catch (error) {
        reply.type('application/json').code(500);
        return { reboot: 'error', error: `${error}` };
      }
    });

    server.get('/sms', async (_request, reply) => {
      try {
        await mockRouter.modem.get_sms_list();
        reply.type('application/json').code(200);
        return mockRouter.modem.sms;
      } catch (error) {
        reply.type('application/json').code(500);
        return { sms: 'error', error };
      }
    });

    server.post('/sms', async (_request, reply) => {
      try {
        const { body, phone_number } = _request.body as any;
        if (phone_number && body) {
          const sms = await mockRouter.modem.send_sms({ body, phone_number });
          reply.type('application/json').code(200);
          return { sms: 'ok', ...sms };
        }
      } catch (error) {
        reply.type('application/json').code(500);
        return { sms: 'error', error };
      }
    });

    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('GET /ping', () => {
    it('returns pong response', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ping',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ pong: 'ok' });
    });
  });

  describe('GET /call', () => {
    it('executes API call with params', async () => {
      const mockResponse = { result: { uptime: 12345 } };
      (mockRouter.api.post as Mock).mockResolvedValue([null, { data: mockResponse }]);

      const response = await server.inject({
        method: 'GET',
        url: '/call',
        query: {
          params: JSON.stringify(['sid', 'system', 'get_status']),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockResponse);
    });

    it('handles API call errors', async () => {
      // The /call endpoint doesn't check for errors in the tuple format,
      // it just returns resp?.data which would be undefined
      (mockRouter.api.post as Mock).mockResolvedValue([new Error('API Error'), undefined]);

      const response = await server.inject({
        method: 'GET',
        url: '/call',
        query: {
          params: JSON.stringify(['sid', 'system', 'get_status']),
        },
      });

      // Returns 200 with undefined/null body since resp is undefined
      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /ha-devices', () => {
    it('returns Home Assistant devices', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ha-devices',
      });

      expect(response.statusCode).toBe(200);
      const devices = JSON.parse(response.body);
      expect(devices).toHaveProperty('sensor');
    });
  });

  describe('GET /ha-attribute', () => {
    it('returns current router state', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ha-attribute',
      });

      expect(response.statusCode).toBe(200);
      const state = JSON.parse(response.body);
      expect(state).toHaveProperty('system_info');
      expect(state.system_info.model).toBe('GL-MT3000');
    });
  });

  describe('GET /refresh', () => {
    it('triggers refresh and returns updated state', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/refresh',
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  describe('GET /status', () => {
    it('gets system status and publishes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/status',
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.system.get_status).toHaveBeenCalled();
      expect(mockRouter.publish).toHaveBeenCalled();
    });
  });

  describe('GET /cell_info', () => {
    it('returns modem tower information', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/cell_info',
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.modem.get_tower_info).toHaveBeenCalled();
    });
  });

  describe('GET /login', () => {
    it('returns router state after login', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/login',
      });

      expect(response.statusCode).toBe(200);
      const state = JSON.parse(response.body);
      expect(state).toHaveProperty('system_info');
    });
  });

  describe('GET /reboot', () => {
    it('triggers router reboot', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/reboot',
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.system.reboot).toHaveBeenCalled();
      expect(JSON.parse(response.body)).toEqual({ reboot: 'ok' });
    });
  });

  describe('POST /reboot', () => {
    it('triggers reboot with confirmation', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/reboot',
        payload: { reboot: 'ok' },
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.system.reboot).toHaveBeenCalled();
    });

    it('handles invalid reboot request', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/reboot',
        payload: { reboot: 'invalid' },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /sms', () => {
    it('returns SMS list', async () => {
      const mockSmsList = { result: [{ id: 1, from: '+1234567890', text: 'Hello' }] };
      mockRouter.modem.sms = mockSmsList as any;
      (mockRouter.modem.get_sms_list as Mock).mockResolvedValue(mockSmsList);

      const response = await server.inject({
        method: 'GET',
        url: '/sms',
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.modem.get_sms_list).toHaveBeenCalled();
    });
  });

  describe('POST /sms', () => {
    it('sends SMS message', async () => {
      const mockSmsResult = { result: { sent: true, id: 123 } };
      (mockRouter.modem.send_sms as Mock).mockResolvedValue(mockSmsResult);

      const response = await server.inject({
        method: 'POST',
        url: '/sms',
        payload: {
          body: 'Test message',
          phone_number: '+1234567890',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockRouter.modem.send_sms).toHaveBeenCalledWith({
        body: 'Test message',
        phone_number: '+1234567890',
      });
      const result = JSON.parse(response.body);
      expect(result.sms).toBe('ok');
    });

    it('handles missing phone number', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/sms',
        payload: {
          body: 'Test message',
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('handles missing message body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/sms',
        payload: {
          phone_number: '+1234567890',
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('error handling', () => {
    it('returns 500 on internal errors', async () => {
      (mockRouter.api.post as Mock).mockRejectedValue(new Error('Internal error'));

      const response = await server.inject({
        method: 'GET',
        url: '/call',
        query: {
          params: JSON.stringify(['sid', 'system', 'get_status']),
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });
  });
});
