/**
 * Base interface for JSON-RPC responses from GL.iNet router
 */
interface RpcResponse<T> {
  id: number;
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * System API Response Types
 */

interface SystemInfoResult {
  hardware_version: string;
  vendor: string;
  firmware_type: string;
  mac: string;
  sn: string;
  hidden_features: string[];
  hardware_feature: {
    reset_button: string;
    nand: boolean;
    bluetooth: boolean;
    nowds: boolean;
    screen: boolean;
    wan: string;
    usb_reset: string;
    submodel: string;
    simo: boolean;
    switch_button: string;
    hwnat: boolean;
    radio: string;
    lan: string;
    rs485: boolean;
    gps: boolean;
    slot: string;
    usb: string;
    build_in_modem: string;
    noled: boolean;
    modem_reset: number;
    microsd: string;
    lcd_sched: boolean;
    fan: boolean;
    mcu: boolean;
    usb_power: string;
  };
  country_code: string;
  software_feature: {
    astrowarp_lite: boolean;
    ipv6: boolean;
    adguard: boolean;
    obfuscation: boolean;
    repeater_eap: boolean;
    nas: boolean;
    cellular_upgrade: boolean;
    vpn: boolean;
    ids_ips: boolean;
    bark: boolean;
    tor: boolean;
    secondwan: boolean;
    sms_forward: boolean;
    mlo: boolean;
    passthrough: boolean;
    ksmbd: boolean;
  };
  cpu_num: number;
  board_info: {
    architecture: string;
    hostname: string;
    kernel_version: string;
    openwrt_version: string;
    model: string;
  };
  firmware_date: string;
  model: string;
  ddns: string;
  sn_bak: string;
  firmware_version: string;
  device_type: number;
}

interface SystemStatusResult {
  network: Array<{
    online: boolean;
    up: boolean;
    interface: string;
  }>;
  wifi: Array<{
    band: string;
    mld: boolean;
    ssid: string;
    encryption: string;
    hidden: boolean;
    passwd: string;
    guest: boolean;
    name: string;
    channel: number;
    up: boolean;
  }>;
  service: Array<{
    name: string;
    status: number;
  }>;
  client: Array<{
    wireless_total: number;
    cable_total: number;
  }>;
  system: {
    netnat_enabled: boolean;
    guest_ip: string;
    flash_app: number;
    ipv6_enabled: boolean;
    memory_buff_cache: number;
    flash_free: number;
    load_average: number[];
    mode: number;
    cpu: {
      temperature: number;
    };
    lan_ip: string;
    tzoffset: string;
    lan_netmask: string;
    time_sync_status: boolean;
    flash_total: number;
    memory_total: number;
    memory_free: number;
    content_protection_enabled: boolean;
    ddns_enabled: boolean;
    uptime: number;
    qos_enabled: boolean;
    prio_enabled: boolean;
    timestamp: number;
    sqm_enabled: boolean;
    guest_netmask: string;
  };
}

/**
 * Modem API Response Types
 */

interface ModemInfoResult {
  offline_doc: boolean;
  modems: Array<{
    type: number;
    simcard: {
      phone_number: string;
      iccid: string;
      imsi: string;
    };
    lock_tower_support: boolean;
    qcfg_unsupport: boolean;
    at_port: string;
    vendor: string;
    devices: string[];
    protocols: string[];
    bus: string;
    name: string;
    sms_support: boolean;
    signal_support: boolean;
    version: string;
    imei: string;
    lock_operator_support: boolean;
  }>;
}

interface ModemStatusResult {
  modems: Array<{
    auto_switching: number;
    simcard: {
      phone_number: string;
      imsi: string;
      mcc: string;
      iccid: string;
      is_special_operator: boolean;
      apn_list: string[];
      apn: string;
      mnc: string;
      carrier: string;
      certification: boolean;
      status: number;
      signal: {
        mode: number;
        rsrq: number;
        rsrp: number;
        sinr: number;
        rssi: number;
        strength: number;
        network_type: string;
      };
    };
    switch_status: number;
    current_sim: string;
    network: {
      status: number;
      traffic_total: string;
      ipv4: {
        gateway: string;
        netmask: string;
        dns: string[];
        ip: string;
      };
    };
    bus: string;
  }>;
  new_sms_count: number;
}

interface ModemCellsInfoResult {
  cells: Array<{
    ul_bandwidth: string;
    dl_bandwidth: string;
    rsrp: number;
    id: string;
    rssi: number;
    tx_channel: string;
    sinr_level: number;
    rsrq_level: number;
    sinr: number;
    rsrq: number;
    rssi_level: number;
    rsrp_level: number;
    mode: string;
    band: number;
    type: string;
  }>;
}

interface ModemSmsListResult {
  list: Array<{
    phone_number: string;
    type: number;
    name: string;
    date: string;
    bus: string;
    status: number;
    body: string;
    sender?: string;
  }>;
}

/**
 * ModemTowerInfo built from raw AT Modem Command calls 
 * - not directly from a GL.iNet API response
 */
interface ModemTowerInfoResult {
  cmd: {
    [key: string]: string;
  };
  type?: string;
  band?: string;
  mcc?: number;
  mnc?: number;
  freq?: number;
  lac?: number;
  eNBId?: number;
  sector?: number;
  url?: string;
}

/**
 * Location API Response Types
 * - not directly from a GL.iNet API response
 */
interface LocationResult {
  latitude: number;
  longitude: number;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

/**
 * Combined State Type
 */

interface GlinetState {
  network?: SystemStatusResult['network'];
  wifi?: SystemStatusResult['wifi'];
  service?: SystemStatusResult['service'];
  client?: SystemStatusResult['client'];
  system?: SystemStatusResult['system'];
  system_info?: SystemInfoResult;
  modem_status?: ModemStatusResult;
  modem_info?: ModemInfoResult;
  modem_cells_info?: ModemCellsInfoResult;
  modem_tower_info?: ModemTowerInfoResult;
  modem_sms?: ModemSmsListResult;
  ip_location?: LocationResult;
}