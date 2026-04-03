import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import GlinetController from '../controller';
import axios from 'axios';

vi.mock('axios');

describe('GlinetController', () => {
  let controller: GlinetController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new GlinetController('192.168.8.1', 'testpass');
  });

  describe('login', () => {
    it('authenticates successfully', async () => {
      (axios.post as Mock).mockImplementation(async (url, data) => {
        if (data.method === 'challenge') {
          return { data: { result: { alg: 'md5', salt: 'abc', nonce: 'xyz' } } };
        }
        if (data.method === 'login') {
          return { data: { result: { sid: 'test-sid' } } };
        }
        return { data: {} };
      });

      await controller.login();

      expect(controller.sid).toBe('test-sid');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('handles authentication failure', async () => {
      (axios.post as Mock).mockResolvedValue({
        data: { error: { message: 'Invalid credentials' } }
      });

      await controller.login();
      expect(controller.sid).toBeUndefined();
    });
  });

  describe('state getter', () => {
    it('combines all state sources', () => {
      controller.system.status = { result: { uptime: 12345 } };
      controller.system.info = { result: { model: 'GL-MT3000' } };
      controller.modem.status = { result: { signal: 80 } };

      const state = controller.state;

      expect(state).toHaveProperty('uptime', 12345);
      expect(state.system_info).toHaveProperty('model', 'GL-MT3000');
    });
  });
});
