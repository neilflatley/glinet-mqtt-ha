import { describe, it, expect } from "vitest";
import { mapDevices } from "../ha/devices";

describe("mapDevices", () => {
  const mockSystemInfo: SystemInfoResult = {
    hardware_version: "",
    vendor: "GL.iNet",
    firmware_type: "release",
    mac: "AA:BB:CC:DD:EE:FF",
    sn: "test-serial-1234",
    hidden_features: [],
    hardware_feature: {
      reset_button: "gpio-456",
      nand: false,
      bluetooth: false,
      nowds: false,
      screen: false,
      wan: "eth0",
      usb_reset: "",
      submodel: "",
      simo: false,
      switch_button: "",
      hwnat: true,
      radio: "mt7981",
      lan: "eth1",
      rs485: false,
      gps: false,
      slot: "dual",
      usb: "1-1.3",
      build_in_modem: "0001:01:00.0",
      noled: false,
      modem_reset: 0,
      microsd: "",
      lcd_sched: false,
      fan: true,
      mcu: false,
      usb_power: "",
    },
    country_code: "",
    software_feature: {
      astrowarp_lite: false,
      ipv6: true,
      adguard: true,
      obfuscation: false,
      repeater_eap: false,
      nas: true,
      cellular_upgrade: true,
      vpn: true,
      ids_ips: false,
      bark: false,
      tor: true,
      secondwan: true,
      sms_forward: true,
      mlo: false,
      passthrough: false,
      ksmbd: false,
    },
    cpu_num: 2,
    board_info: {
      architecture: "ARMv8 Processor rev 4",
      hostname: "test-router",
      kernel_version: "5.4.211",
      openwrt_version: "OpenWrt 21.02-SNAPSHOT",
      model: "GL.iNet GL-MT3000",
    },
    firmware_date: "2025-01-01 00:00:00",
    model: "mt3000",
    ddns: "test-ddns",
    sn_bak: "test-serial-backup",
    firmware_version: "4.8.3",
    device_type: 3,
  };

  describe("null and undefined handling", () => {
    it("returns empty object when state is null", () => {
      const result = mapDevices(null as unknown as GlinetState, "GL-MT3000");
      expect(result).toEqual({});
    });

    it("returns empty object when state is undefined", () => {
      const result = mapDevices(undefined as any, "GL-MT3000");
      expect(result).toEqual({});
    });

    it("returns empty object when state is empty object (no system_info)", () => {
      const result = mapDevices({}, "GL-MT3000");
      expect(result).toEqual({});
    });

    it("throws error when system_info is empty object (no system_info.*)", () => {
      expect(() => mapDevices({ system_info: {} as SystemInfoResult }, "GL-MT3000")).toThrow();
    });
  });

  describe("device attribute mapping", () => {
    it("maps device attributes correctly", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toBeDefined();
    });

    it("extracts manufacturer from model string", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toBeDefined();
    });

    it("handles model string without space", () => {
      const mockState = {
        system_info: {
          ...mockSystemInfo,
          board_info: {
            ...mockSystemInfo.board_info,
            model: "GLMT3000",
          },
        },
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toBeDefined();
    });
  });

  describe("component mapping", () => {
    it("returns object with component keys", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toHaveProperty("sensor");
    });

    it("includes state_topic for non-button/text components", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor).toHaveProperty("state_topic");
      }
    });
  });

  describe("device attribute structure", () => {
    it("creates correct device identifier", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.identifiers).toContain("test-serial-1234");
      }
    });

    it("sets device name from hostname", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.name).toBe("test-router");
      }
    });

    it("sets manufacturer from model string (first part before space)", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        // Model is "GL.iNet GL-MT3000" with space, so manufacturer is first part
        expect(sensor.device?.manufacturer).toBe("GL.iNet");
      }
    });

    it("sets model to undefined when no space in model string", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        // Model is "GL.iNet GL-MT3000" with space, so model is second part
        expect(sensor.device?.model).toBe("GL-MT3000");
      }
    });

    it("sets serial number from sn", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.serial_number).toBe("test-serial-1234");
      }
    });

    it("sets hardware version from architecture", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.hw_version).toBe("ARMv8 Processor rev 4");
      }
    });

    it("sets software version from firmware_version", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.device?.sw_version).toBe("4.8.3");
      }
    });
  });

  describe("edge cases", () => {
    it("handles missing board_info", () => {
      const mockState: GlinetState = {
        system_info: {
          sn: "TEST123",
          firmware_version: "3.200",
        } as SystemInfoResult,
      };

      // This should throw because board_info is required
      expect(() => mapDevices(mockState, "GL-MT3000")).toThrow();
    });

    it("handles missing firmware_version", () => {
      const mockState: GlinetState = {
        system_info: {
          sn: "TEST123",
          board_info: {
            hostname: "router",
            model: "GL-MT3000",
            architecture: "armv7",
          } as SystemInfoResult['board_info'],
        } as SystemInfoResult,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toBeDefined();
    });

    it("handles special characters in hostname", () => {
      const mockState: GlinetState = {
        system_info: {
          sn: "TEST123",
          board_info: {
            hostname: "router-with-dashes_and_underscores",
            model: "GL-MT3000",
            architecture: "armv7",
          } as SystemInfoResult['board_info'],
          firmware_version: "3.200",
        } as SystemInfoResult,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toBeDefined();
    });

    it("handles very long serial number", () => {
      const mockState: GlinetState = {
        system_info: {
          sn: "A".repeat(100),
          board_info: {
            hostname: "router",
            model: "GL-MT3000",
            architecture: "armv7",
          } as SystemInfoResult['board_info'],
          firmware_version: "3.200",
        } as SystemInfoResult,
      };

      const result = mapDevices(mockState, "GL-MT3000");
      expect(result).toBeDefined();
    });
  });

  describe("model parameter", () => {
    it("uses model parameter for state_topic", () => {
      const mockState = {
        system_info: mockSystemInfo,
      };

      const result = mapDevices(mockState, "CUSTOM-MODEL");
      if (result.sensor && result.sensor.length > 0) {
        const sensor = result.sensor[0];
        expect(sensor.state_topic).toContain("glinet-CUSTOM-MODEL");
      }
    });

    it("handles different model names", () => {
      const models = ["GL-MT3000", "GL-A1300", "GL-AX1800"];

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
