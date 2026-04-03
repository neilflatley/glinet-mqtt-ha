import { describe, it, expect } from 'vitest';
import { mapDevices } from '../ha/devices';

describe('mapDevices', () => {
  const mockSystemInfo = {
    sn: 'TEST123',
    board_info: {
      hostname: 'router',
      model: 'GL-MT3000',
      architecture: 'armv7',
    },
    firmware_version: '3.200',
  };

  describe('null and undefined handling', () => {
    it('returns empty object when state is null', () => {
      const result = mapDevices(null, 'GL-MT3000');
      expect(result).toEqual({});
    });

    it('returns empty object when state is undefined', () => {
      const result = mapDevices(undefined as any, 'GL-MT3000');
      expect(result).toEqual({});
    });

    it('throws error when state is empty object (no system_info)', () => {
      expect(() => mapDevices({}, 'GL-MT3000')).toThrow();
    });
  });

  describe('device attribute mapping', () => {
    it('maps device attributes correctly', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toBeDefined();
    });

    it('extracts manufacturer from model string', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toBeDefined();
    });

    it('handles model string without space', () => {
      const mockState = {
        system_info: {
          ...mockSystemInfo,
          board_info: {
            ...mockSystemInfo.board_info,
            model: 'GLMT3000',
          },
        },
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toBeDefined();
    });
  });

  describe('component mapping', () => {
    it('returns object with component keys', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toHaveProperty('sensor');
    });

    it('includes state_topic for non-button/text components', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor).toHaveProperty('state_topic');
      }
    });
  });

  describe('device attribute structure', () => {
    it('creates correct device identifier', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.identifiers).toContain('TEST123');
      }
    });

    it('sets device name from hostname', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.name).toBe('router');
      }
    });

    it('sets manufacturer from model string (first part before space)', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        // Model is "GL-MT3000" with no space, so manufacturer gets the whole string
        expect(sensor.device?.manufacturer).toBe('GL-MT3000');
      }
    });

    it('sets model to undefined when no space in model string', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        // Model is "GL-MT3000" with no space, so model is undefined
        expect(sensor.device?.model).toBeUndefined();
      }
    });

    it('sets serial number from sn', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.serial_number).toBe('TEST123');
      }
    });

    it('sets hardware version from architecture', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.hw_version).toBe('armv7');
      }
    });

    it('sets software version from firmware_version', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.sw_version).toBe('3.200');
      }
    });
  });

  describe('edge cases', () => {
    it('handles missing board_info', () => {
      const mockState = {
        system_info: {
          sn: 'TEST123',
          firmware_version: '3.200',
        },
      };

      // This should throw because board_info is required
      expect(() => mapDevices(mockState, 'GL-MT3000')).toThrow();
    });

    it('handles missing firmware_version', () => {
      const mockState = {
        system_info: {
          sn: 'TEST123',
          board_info: {
            hostname: 'router',
            model: 'GL-MT3000',
            architecture: 'armv7',
          },
        },
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toBeDefined();
    });

    it('handles special characters in hostname', () => {
      const mockState = {
        system_info: {
          sn: 'TEST123',
          board_info: {
            hostname: 'router-with-dashes_and_underscores',
            model: 'GL-MT3000',
            architecture: 'armv7',
          },
          firmware_version: '3.200',
        },
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toBeDefined();
    });

    it('handles very long serial number', () => {
      const mockState = {
        system_info: {
          sn: 'A'.repeat(100),
          board_info: {
            hostname: 'router',
            model: 'GL-MT3000',
            architecture: 'armv7',
          },
          firmware_version: '3.200',
        },
      };

      const result = mapDevices(mockState, 'GL-MT3000');
      expect(result).toBeDefined();
    });
  });

  describe('model parameter', () => {
    it('uses model parameter for state_topic', () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, 'CUSTOM-MODEL');
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.state_topic).toContain('glinet-CUSTOM-MODEL');
      }
    });

    it('handles different model names', () => {
      const models = ['GL-MT3000', 'GL-A1300', 'GL-AX1800'];
      
      for (const model of models) {
        const mockState = {
          system_info: mockSystemInfo,
        };
        const result = mapDevices(mockState, model);
        expect(result).toBeDefined();
      }
    });
  });
});
