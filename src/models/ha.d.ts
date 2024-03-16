type Sensor = {
  unique_id: string;
  object_id: string;
  state_topic: string;
  value_template: string;
  device_class: string;
  availability: {
    topic: string;
    value_template: string;
    payload_available: string;
  };
  json_attributes_topic: string;
  json_attributes_template: string;
  icon: string;
  device: Device;
};

type Device = {
  identifiers: string[];
  name: string;
  manufacturer: string;
  model: string;
  hw_version: string;
  sw_version: string;
  configuration_url: string;
};
