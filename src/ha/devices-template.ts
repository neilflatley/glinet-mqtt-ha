export const devices = (model: string) => ({
  binary_sensor: [
    {
      name: `Connectivity`,
      unique_id: `glinet_${model}_connected`,
      object_id: `glinet_${model}_connected`,
      value_template: `{{ (value_json.network | selectattr('online', 'true') | list | first).online }}`,
      payload_on: true,
      payload_off: false,
      device_class: `connectivity`,
      json_attributes_topic: `glinet_${model}/attribute`,
      json_attributes_template: `{{ value_json.network | tojson }}`,
      icon: `mdi:router-network-wireless`,
    },
    {
      name: `Charging`,
      enabled_by_default: false,
      unique_id: `glinet_${model}_charging`,
      object_id: `glinet_${model}_charging`,
      value_template: `{{ value_json.system.mcu.charging_status }}`,
      payload_on: 1,
      payload_off: 0,
      device_class: `battery_charging`,
      entity_category: `diagnostic`,
    },
    // {
    //   name: `Unread SMS`,
    //   unique_id: `glinet_${model}_unread_sms`,
    //   object_id: `glinet_${model}_unread_sms`,
    //   value_template: `{{ value_json.sms.unreadMsgs > 0 }}`,
    //   payload_on: true,
    //   payload_off: false,
    //   availability: {
    //     topic: `glinet_${model}/attribute`,
    //     value_template: `{{ value_json.sms.ready }}`,
    //     payload_available: true,
    //   },
    //   json_attributes_topic: `glinet_${model}/attribute`,
    //   json_attributes_template: `{{ value_json.sms | tojson }}`,
    // },
  ],
  button: [
    {
      name: `Restart`,
      unique_id: `glinet_${model}_restart`,
      object_id: `glinet_${model}_restart`,
      availability: {
        topic: `glinet_${model}/attribute`,
        value_template: `{{ value_json.system.lan_ip }}`,
        payload_available: `192.168.8.1`,
      },
      command_topic: `glinet_${model}/command`,
      payload_press: `restart`,
      device_class: `restart`,
      entity_category: `config`,
    },
    // {
    //   name: `Send SMS`,
    //   unique_id: `glinet_${model}_send_sms`,
    //   object_id: `glinet_${model}_send_sms`,
    //   availability: {
    //     topic: `glinet_${model}/attribute`,
    //     value_template: `{{ value_json.sms.sendEnabled }}`,
    //     payload_available: true,
    //   },
    //   command_topic: `glinet_${model}/command`,
    //   command_template:
    //     "send_sms={`msg`:`{{ states('text.glinet_${model}_sms_message') }}`,`to`:`{{ states('text.glinet_${model}_sms_recipient') }}`}",
    //   icon: `mdi:message-plus`,
    // },
  ],
  sensor: [
    {
      name: `Battery`,
      enabled_by_default: false,
      unique_id: `glinet_${model}_battery_charge`,
      object_id: `glinet_${model}_battery_charge`,
      state_class: `measurement`,
      value_template: `{{ value_json.system.mcu.charge_percent }}`,
      device_class: `battery`,
      unit_of_measurement: `%`,
      entity_category: `diagnostic`,
    },
    {
      name: `Connected clients`,
      unique_id: `glinet_${model}_connected_clients`,
      object_id: `glinet_${model}_connected_clients`,
      state_class: `measurement`,
      value_template: `{{ value_json.client[0].wireless_total | int(0) }}`,
      icon: `mdi:wifi-star`,
      json_attributes_topic: `glinet_${model}/attribute`,
      json_attributes_template: `{{ value_json.client[0] | tojson }}`,
    },
    {
      name: `Connection text`,
      unique_id: `glinet_${model}_connection_text`,
      object_id: `glinet_${model}_connection_text`,
      value_template: `{{ {2:"2G",3:"3G",4:"4G",41:"4G+",5:"5G"}[value_json.modem_status.modems[0].simcard.signal.mode] }}`,
      icon: `mdi:signal-4g`,
    },
    {
      name: `Data use (TX)`,
      unique_id: `glinet_${model}_data_usage_tx`,
      object_id: `glinet_${model}_data_usage_tx`,
      state_class: `total_increasing`,
      value_template: `{{ value_json.modem_status.modems[0].network.tx }}`,
      device_class: `data_size`,
      unit_of_measurement: `B`,
      icon: `mdi:counter`,
      entity_category: `diagnostic`,
    },
    {
      name: `Data use (RX)`,
      unique_id: `glinet_${model}_data_usage_rx`,
      object_id: `glinet_${model}_data_usage_rx`,
      state_class: `total_increasing`,
      value_template: `{{ value_json.modem_status.modems[0].network.rx }}`,
      device_class: `data_size`,
      unit_of_measurement: `B`,
      icon: `mdi:counter`,
      entity_category: `diagnostic`,
    },
    {
      name: `Data use`,
      unique_id: `glinet_${model}_data_usage`,
      object_id: `glinet_${model}_data_usage`,
      state_class: `total_increasing`,
      value_template: `{{ (value_json.modem_status.modems[0].network.rx + value_json.modem_status.modems[0].network.rx) }}`,
      device_class: `data_size`,
      unit_of_measurement: `B`,
      icon: `mdi:counter`,
      entity_category: `diagnostic`,
    },
    {
      name: `Data used (GiB)`,
      unique_id: `glinet_${model}_data_usage_gb`,
      object_id: `glinet_${model}_data_usage_gb`,
      state_class: `total_increasing`,
      value_template: `{{ ((value_json.modem_status.modems[0].network.rx + value_json.modem_status.modems[0].network.rx) / 1073741824) | round(3) }}`,
      device_class: `data_size`,
      unit_of_measurement: `GiB`,
      icon: `mdi:counter`,
    },
    {
      name: `Network`,
      unique_id: `glinet_${model}_connected_network`,
      object_id: `glinet_${model}_connected_network`,
      value_template: `{{ value_json.modem_status.modems[0].simcard.carrier }}`,
      icon: `mdi:cellphone-text`,
    },
    {
      name: `Router`,
      unique_id: `glinet_${model}_router`,
      object_id: `glinet_${model}_router`,
      value_template: `{{ value_json.system.lan_ip }}`,
      icon: `mdi:router-wireless-settings`,
      json_attributes_topic: `glinet_${model}/attribute`,
      json_attributes_template: `{{ value_json.system | tojson }}`,
      entity_category: `diagnostic`,
    },
    {
      name: `RSSI`,
      unique_id: `glinet_${model}_signal_strength`,
      object_id: `glinet_${model}_signal_strength`,
      state_class: `measurement`,
      value_template: `{{ value_json.modem_status.modems[0].simcard.signal.rssi }}`,
      device_class: `signal_strength`,
      unit_of_measurement: `dBm`,
      entity_category: `diagnostic`,
      icon: `mdi:signal-distance-variant`,
    },
    {
      name: `Service type`,
      unique_id: `glinet_${model}_service_type`,
      object_id: `glinet_${model}_service_type`,
      value_template: `{{ value_json.modem_status.modems[0].simcard.signal.network_type }}`,
      icon: `mdi:radio-tower`,
    },
    {
      name: `Signal`,
      unique_id: `glinet_${model}_signal`,
      object_id: `glinet_${model}_signal`,
      state_class: `measurement`,
      value_template: `{{ value_json.modem_status.modems[0].simcard.signal.strength }}`,
      icon: `mdi:signal`,
      json_attributes_topic: `glinet_${model}/attribute`,
      json_attributes_template: `{{ value_json.modem_status.modems[0].simcard | tojson }}`,
    },
    {
      name: `Started`,
      unique_id: `glinet_${model}_started`,
      object_id: `glinet_${model}_started`,
      value_template: `{{ (as_timestamp(now()) | round(0) - value_json.system.uptime) | as_datetime }}`,
      device_class: `timestamp`,
      icon: `mdi:clock`,
      entity_category: `diagnostic`,
    },
    {
      name: `WAN interface`,
      unique_id: `glinet_${model}_wan_interface`,
      object_id: `glinet_${model}_wan_interface`,
      value_template: `{{ value_json.network | selectattr('online', 'true') | map(attribute='interface') | list | first }}`,
      icon: `mdi:help-network-outline`,
      json_attributes_topic: `glinet_${model}/attribute`,
      json_attributes_template: `{%- set a = namespace(value={}) -%}{%- for n in value_json.network|list -%}{%- set a.value = dict(a.value, **{n.interface: { "online": n.online, "up": n.up }}) -%}{%- endfor %}{{ a.value | tojson }}`,
      entity_category: `diagnostic`,
    },
    // {
    //   name: `WWAN band`,
    //   unique_id: `glinet_${model}_wwan_band`,
    //   object_id: `glinet_${model}_wwan_band`,
    //   value_template: `{{ value_json.wwanadv.curBand }}`,
    //   icon: `mdi:signal-variant`,
    //   json_attributes_topic: `glinet_${model}/attribute`,
    //   json_attributes_template: `{{ value_json.wwanadv | tojson }}`,
    //   entity_category: `diagnostic`,
    // },
  ],
  // text: [
  //   {
  //     name: `SMS message`,
  //     unique_id: `glinet_${model}_sms_message`,
  //     object_id: `glinet_${model}_sms_message`,
  //     command_topic: `glinet_${model}/command`,
  //     command_template: `set_msg={{ value }}`,
  //     state_topic: `glinet_${model}/sms/message`,
  //     icon: `mdi:message-text`,
  //   },
  //   {
  //     name: `SMS recipient`,
  //     unique_id: `glinet_${model}_sms_recipient`,
  //     object_id: `glinet_${model}_sms_recipient`,
  //     command_topic: `glinet_${model}/command`,
  //     command_template: `set_to={{ value }}`,
  //     state_topic: `glinet_${model}/sms/recipient`,
  //     icon: `mdi:message-question`,
  //   },
  // ],
});
