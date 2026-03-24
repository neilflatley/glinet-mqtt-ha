import { MqttClient, connectAsync } from "mqtt";
import { setTimeout as sleep } from "timers/promises";
import { mapDevices } from "./ha/devices.js";
import GlinetController from "./controller.js";

export class Mqtt {
  client?: MqttClient;
  count = 0;
  host = process.env.MQTT_HOST;
  refresh = Number(process.env.MQTT_REFRESH);
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
        await this.birth();
      }
    }
    return this;
  };

  birth = async () => {
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

        if (cmd === "set_sms_msg") {
          this.router.smsBody = value;
          await this.publish(this.router.smsBody, `glinet-${this.router.model}/sms/message`);
        }
        if (cmd === "set_sms_to") {
          this.router.smsPhoneNumber = value;
          await this.publish(this.router.smsPhoneNumber, `glinet-${this.router.model}/sms/recipient`);
        }
        if (cmd === "send_sms") {
          const json = JSON.parse(value);
          this.router.modem.send_sms({ body: json.msg, phone_number: json.to });
        }
        if (cmd === "restart") this.router.system.reboot();
      }
    });

    if (!Number.isNaN(this.refresh) && this.refresh > 0) {
      // start an infinite loop
      console.log(
        `[mqtt] starting background loop refreshing at intervals of MQTT_REFRESH=${this.refresh} seconds`,
      );
      let quit = false;
      process.on("exit", (code) => {
        quit = true;
      });

      // this is the signal that nodemon uses
      process.once("SIGUSR2", () => {
        quit = true;
        process.kill(process.pid, "SIGUSR2");
      });

      while (quit === false) {
        await sleep(this.refresh * 1000);
        await this.router.refresh();
      }
    }
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
            `glinet-${this.router.model}/`,
          )}/config`,
        );
        count++;
      }
    }
    if (count) console.log(`[mqtt] published ${count} discovery messages`);
    
    await sleep(5000);
    this.publish();
  };

  publish = async (
    message = this.message,
    topic = `glinet-${this.router.model}/attribute`,
  ) => {
    if (this.client) {
      await this.client.publishAsync(topic, message);
      if (topic === `glinet-${this.router.model}/attribute`)
        console.log(
          `[mqtt] published ${++this.count} status messages since startup`,
        );
    }
  };
}

export const mqtt = new Mqtt();
