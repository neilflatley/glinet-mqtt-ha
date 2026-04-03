import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import GlinetController from '../../controller';

vi.mock('axios');

describe('GlinetController Unit', () => {
  let controller: GlinetController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new GlinetController('192.168.8.1', 'testpass');
  });

  it('handles network timeout gracefully', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('ETIMEDOUT'));
    
    await expect(controller.login()).rejects.toThrow('ETIMEDOUT');
  });

  it('completes full login flow with realistic timing', async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ data: { result: { alg: 1, salt: 'salt', nonce: 'nonce' } } })
      .mockResolvedValueOnce({ data: { result: { sid: 'test-sid' } } });

    await controller.login();
    expect(controller.sid).toBe('test-sid');
  });
});
