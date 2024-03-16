import { MqttClient, connectAsync } from "mqtt";
import { mapDevices } from "./ha/devices.js";
import GlinetController from "./controller.js";

export class Mqtt {
  client?: MqttClient;
  count = 0;
  host = process.env.MQTT_HOST;
  info: any;
  status: any;
  router!: GlinetController;

  get devices() {
    const { model, state } = this.router;
    return mapDevices(state, model);
  }
  get message() {
    return JSON.stringify(this.router.state);
  }
  init = async (router: GlinetController) => {
    this.router = router;
    if (!this.client && this.host) {
      const client = await connectAsync(this.host);

      if (client) {
        this.client = client;
        console.log(`[mqtt] connected client ${this.host}`);
        await this.discovery();
        this.birth();
      }
    }
    return this;
  };

  birth = () => {
    if (!this.client || !this.router) return;
    this.client.on("end", () => {
      this.client = undefined;
    });
    // subscribe to ha birth message and republish discovery messages
    // subscribe to ha device command topics
    this.client.subscribe([
      `homeassistant/status`,
      `glinet-${this.router.model}/command`,
    ]);

    this.client.on("message", async (t, buffer) => {
      const payload = buffer.toString();
      console.log(`[mqtt] received payload '${payload}' from ${t}`);

      if (t === `homeassistant/status` && payload === "online")
        this.discovery();

      if (t === `glinet-${this.router.model}/command`) {
        if (!this.router) return;
        const cmd = payload.split("=")[0];
        const value = payload.split("=")?.[1];

        // if (cmd === "set_msg") {
        //   this.router.msg = value;
        //   await this.publish(this.router.msg, `glinet-${this.model}/sms/message`);
        // }
        // if (cmd === "set_to") {
        //   this.router.to = value;
        //   await this.publish(this.router.to, `glinet-${this.model}/sms/recipient`);
        // }
        // if (cmd === "send_sms") {
        //   const json = JSON.parse(value);
        //   this.router.sendSms({ message: json.msg, recipient: json.to });
        // }
        if (cmd === "restart") this.router.system.reboot();
      }
    });
  };

  discovery = async () => {
    // publish ha status topics
    // this.router.to &&
    //   (await this.publish(this.router.to, `glinet-${this.model}/sms/recipient`));
    // this.router.msg &&
    //   (await this.publish(this.router.msg, `glinet-${this.model}/sms/message`));

    // publish mqtt discovery devices
    let count = 0;
    for (const [component, sensors] of Object.entries(this.devices)) {
      for (const device of sensors) {
        await this.publish(
          JSON.stringify(device),
          `homeassistant/${component}/${device.unique_id.replace(
            `glinet-${this.router.model}_`,
            `glinet-${this.router.model}/`
          )}/config`
        );
        count++;
      }
    }
    if (count) console.log(`[mqtt] published ${count} discovery messages`);
    setTimeout(() => {
      this.publish();
    }, 5000);
  };

  publish = async (
    message = this.message,
    topic = `glinet_${this.router.model}/attribute`
  ) => {
    if (this.client) {
      await this.client.publishAsync(topic, message);
      if (topic === `glinet_${this.router.model}/attribute`)
        console.log(
          `[mqtt] published ${++this.count} status messages since startup`
        );
    }
  };
}

export const mqtt = new Mqtt();
