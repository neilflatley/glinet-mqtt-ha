import GlinetController from "src/controller.ts";
import { devices } from "./devices-template.ts";

const mapDeviceAttribute = (json: GlinetState & SystemInfoResult): Device => ({
  identifiers: [json.sn],
  name: json.board_info.hostname,
  manufacturer: json.board_info.model?.split(" ")[0],
  model: json.board_info.model?.split(" ")?.[1],
  serial_number: json.sn,
  hw_version: json.board_info.architecture,
  sw_version: `${json.firmware_version}`,
  configuration_url: `http://${json.system?.lan_ip}`,
});

export const mapDevices = (state: GlinetController["state"], model: string) => {
  if (!state || !state.system_info) return {};
  const deviceAttribute = mapDeviceAttribute({...state, ...state.system_info});

  const haDevices = Object.entries(devices(model));

  const completeDevices = Object.fromEntries(
    haDevices.map(([component, devices]) => [
      component,
      devices.map<Sensor>((d: any) => {
        if (!d.device) d.device = deviceAttribute;
        if (!d.state_topic && ![`button`, `text`].includes(component))
          d.state_topic = `glinet-${model}/attribute`;
        return d;
      }),
    ]),
  );
  return completeDevices;
};
