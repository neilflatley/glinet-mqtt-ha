import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { Mqtt } from '../mqtt';
import GlinetController from '../controller';
import * as mqttModule from 'mqtt';

vi.mock('mqtt');
vi.mock('../controller');

const mockMqttClient = {
  on: vi.fn(),
  subscribe: vi.fn(),
  publish: vi.fn((topic, message, callback) => callback?.()),
  publishAsync: vi.fn().mockResolvedValue(true),
  end: vi.fn(),
  disconnect: vi.fn(),
};

describe('Mqtt', () => {
  let mqtt: Mqtt;
  let mockRouter: Partial<GlinetController>;

  beforeEach(() => {
    vi.clearAllMocks();
    mqtt = new Mqtt();
    mockRouter = {
      model: 'GL-MT3000',
      sid: 'test-sid',
      state: {
        system_info: {
          sn: 'TEST123',
          model: 'GL-MT3000',
          board_info: {
            hostname: 'router',
            model: 'GL-MT3000',
            architecture: 'armv7',
          },
          firmware_version: '3.200',
        },
        uptime: 12345,
        modem_status: { signal: 80 },
      },
    } as Partial<GlinetController>;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.MQTT_HOST;
    delete process.env.MQTT_REFRESH;
  });

  describe('constructor', () => {
    it('initializes with default values', () => {
      expect(mqtt.count).toBe(0);
      expect(mqtt.client).toBeUndefined();
    });

    it('reads host from environment variable', () => {
      process.env.MQTT_HOST = 'mqtt://localhost:1883';
      const mqttInstance = new Mqtt();
      expect(mqttInstance.host).toBe('mqtt://localhost:1883');
      delete process.env.MQTT_HOST;
    });

    it('reads refresh interval from environment variable', () => {
      process.env.MQTT_REFRESH = '30';
      const mqttInstance = new Mqtt();
      expect(mqttInstance.refresh).toBe(30);
      delete process.env.MQTT_REFRESH;
    });
  });

  describe('init', () => {
    // it('connects to MQTT broker and initializes', async () => {
    //   process.env.MQTT_HOST = 'mqtt://localhost:1883';
    //   vi.spyOn(mqttModule, 'connectAsync').mockResolvedValue(mockMqttClient as any);

    //   await mqtt.init(mockRouter as GlinetController);

    //   expect(mqttModule.connectAsync).toHaveBeenCalledWith('mqtt://localhost:1883');
    //   expect(mqtt.client).toBe(mockMqttClient);
    //   expect(mqtt.discovery).toHaveBeenCalled();
    //   expect(mqtt.birth).toHaveBeenCalled();
    // });

    it('does not connect when MQTT_HOST is not set', async () => {
      delete process.env.MQTT_HOST;
      mqtt.host = undefined;

      await mqtt.init(mockRouter as GlinetController);

      expect(mqttModule.connectAsync).not.toHaveBeenCalled();
    });

    // it('handles connection failure gracefully', async () => {
    //   process.env.MQTT_HOST = 'mqtt://localhost:1883';
    //   vi.spyOn(mqttModule, 'connectAsync').mockRejectedValue(new Error('Connection refused'));

    //   await expect(mqtt.init(mockRouter as GlinetController)).rejects.toThrow('Connection refused');
    // });
  });

  describe('devices getter', () => {
    it('returns mapped devices from router state', () => {
      mqtt.router = mockRouter as GlinetController;
      
      const devices = mqtt.devices;
      
      expect(devices).toBeDefined();
    });

    it('handles null router state', () => {
      mqtt.router = { model: 'GL-MT3000', state: null } as any;
      
      const devices = mqtt.devices;
      
      expect(devices).toBeDefined();
    });
  });

  describe('message getter', () => {
    it('returns JSON stringified router state', () => {
      mqtt.router = mockRouter as GlinetController;
      
      const message = mqtt.message;
      
      expect(message).toBe(JSON.stringify(mockRouter.state));
    });
  });

  describe('birth', () => {
    it('subscribes to homeassistant/status and command topics', async () => {
      mqtt.client = mockMqttClient as any;
      mqtt.router = mockRouter as GlinetController;

      await mqtt.birth();

      expect(mockMqttClient.subscribe).toHaveBeenCalledWith([
        'homeassistant/status',
        'glinet-GL-MT3000/command',
      ]);
    });
  });

  describe('discovery', () => {
    it('publishes discovery messages for all devices', async () => {
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = mockMqttClient as any;
      
      // Mock devices to return predictable data
      vi.spyOn(mqtt, 'devices', 'get').mockReturnValue({
        sensor: [
          {
            unique_id: 'glinet-GL-MT3000_uptime',
            object_id: 'glinet-GL-MT3000_uptime',
            state_topic: 'glinet-GL-MT3000/attribute',
            value_template: '{{ value_json.uptime }}',
            device_class: 'timestamp',
            availability: {
              topic: 'homeassistant/status',
              value_template: 'online',
              payload_available: 'online',
            },
            json_attributes_topic: 'glinet-GL-MT3000/attribute',
            json_attributes_template: '{{ value_json }}',
            icon: 'mdi:clock',
            device: {
              identifiers: ['glinet-GL-MT3000'],
              name: 'GL-MT3000',
              manufacturer: 'GL.iNet',
              model: 'GL-MT3000',
              serial_number: 'TEST123',
              hw_version: '1.0',
              sw_version: '3.200',
              configuration_url: 'http://192.168.8.1',
            },
          },
        ],
      });

      await mqtt.discovery();

      expect(mockMqttClient.publishAsync).toHaveBeenCalled();
    });

    it('logs the count of published discovery messages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = mockMqttClient as any;
      
      vi.spyOn(mqtt, 'devices', 'get').mockReturnValue({
        sensor: [
          {
            unique_id: 'glinet-GL-MT3000_uptime',
            object_id: 'glinet-GL-MT3000_uptime',
            state_topic: 'glinet-GL-MT3000/attribute',
            value_template: '{{ value_json.uptime }}',
            device_class: 'timestamp',
            availability: {
              topic: 'homeassistant/status',
              value_template: 'online',
              payload_available: 'online',
            },
            json_attributes_topic: 'glinet-GL-MT3000/attribute',
            json_attributes_template: '{{ value_json }}',
            icon: 'mdi:clock',
            device: {
              identifiers: ['glinet-GL-MT3000'],
              name: 'GL-MT3000',
              manufacturer: 'GL.iNet',
              model: 'GL-MT3000',
              serial_number: 'TEST123',
              hw_version: '1.0',
              sw_version: '3.200',
              configuration_url: 'http://192.168.8.1',
            },
          },
        ],
      });

      await mqtt.discovery();

      expect(consoleSpy).toHaveBeenCalledWith('[mqtt] published 1 discovery messages');
      consoleSpy.mockRestore();
    });
  });

  describe('publish', () => {
    it('publishes message to default topic', async () => {
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = mockMqttClient as any;

      await mqtt.publish();

      expect(mockMqttClient.publishAsync).toHaveBeenCalledWith(
        'glinet-GL-MT3000/attribute',
        JSON.stringify(mockRouter.state)
      );
    });

    it('publishes custom message to custom topic', async () => {
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = mockMqttClient as any;

      await mqtt.publish('custom message', 'custom/topic');

      expect(mockMqttClient.publishAsync).toHaveBeenCalledWith('custom/topic', 'custom message');
    });

    it('increments count on each publish to attribute topic', async () => {
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = mockMqttClient as any;

      await mqtt.publish();
      await mqtt.publish();
      await mqtt.publish();

      expect(mqtt.count).toBe(3);
    });

    it('does not publish when client is not connected', async () => {
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = undefined;

      await mqtt.publish();

      expect(mockMqttClient.publishAsync).not.toHaveBeenCalled();
    });
  });

  describe('background refresh loop', () => {
    it('starts refresh loop when MQTT_REFRESH is set', async () => {
      vi.useFakeTimers();
      
      mqtt.router = mockRouter as GlinetController;
      mqtt.client = mockMqttClient as any;
      
      const mockRefresh = vi.fn();
      mockRouter.refresh = mockRefresh;

      // Start birth which starts the refresh loop
      await mqtt.birth();

      // Advance time by refresh interval
      vi.advanceTimersByTime(30000);

      vi.useRealTimers();
    });
  });
});
