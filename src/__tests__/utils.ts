import axios from 'axios';
import type { Mock } from 'vitest';

export function mockAxiosResponse(response: unknown) {
  return (axios.post as Mock).mockResolvedValue({ data: response });
}

export function mockAxiosError(error: unknown) {
  return (axios.post as Mock).mockRejectedValue(error);
}

export function createMockState() {
  return {
    system_info: {
      sn: 'TEST123',
      board_info: { hostname: 'router', model: 'GL-MT3000', architecture: 'armv7' },
      firmware_version: '3.200',
    },
    uptime: 12345,
    system_status: { result: { uptime: 12345 } },
    modem_status: { result: { signal: 80 } },
  };
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
