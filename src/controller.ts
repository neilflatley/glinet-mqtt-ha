import { to } from "await-to-js";
import axios, { AxiosResponse } from "axios";
import crypto from "crypto";
import { setTimeout as sleep } from "timers/promises";
import up from "unixpass";
import { mqtt } from "./mqtt.ts";

class GlinetController {
  private host = "192.168.8.1";
  private username = "root";

  private password = "MyPassword";
  private routerUri = `http://${this.host}`;

  public smsPhoneNumber = "07000000000";
  public smsBody = "";

  get api_uri() {
    return `${this.routerUri}/rpc`;
  }

  sid?: string; // Token to connect to router

  get model() {
    return this.system.info?.result?.model;
  }
  get modem_bus() {
    return (
      this.system.info?.result?.hardware_feature.build_in_modem.split(",")[0] ||
      "0001:01:00.0"
    );
  }
  get modem_port() {
    return this.modem.info?.result?.modems[0].at_port || "/dev/mhi_DUN";
  }
  get phone_number() {
    return this.modem.info?.result?.modems[0].simcard.phone_number || "";
  }
  get state() {
    const { location, modem, system } = this;
    if (Object.keys(system.status.result || {}).length)
      return {
        ...system.status.result,
        system_info: system.info.result,
        modem_status: modem.status.result,
        modem_info: modem.info.result,
        modem_cells_info: modem.cells_info.result,
        modem_tower_info: modem.tower_info,
        modem_sms: modem.sms.result,
        ip_location: location.current,
      };
    return null;
  }

  constructor(
    host = process.env.GLINET_HOST,
    password = process.env.GLINET_PASSWORD,
  ) {
    if (password) this.password = password;
    this.host = host || this.host;
    this.routerUri = `http://${this.host}`;
    console.log(`Connecting to ${this.routerUri}`);
  }
  api = {
    call: async (...params: [string, string] | [string, string, any]) => {
      const [err, res] = await this.api.post([this.sid, ...params]);
      if (err) throw err;
      return res?.data;
    },
    post: async (
      params:
        | [string | undefined, string, string]
        | [string | undefined, string, string, any]
        | { [param: string]: string },
      method = "call",
    ): Promise<[Error, undefined] | [null, AxiosResponse]> => {
      if (method === "call" && !this.sid) await this.login();
      // Add latest sid to first array param
      if (Array.isArray(params)) params[0] = this.sid;

      const [err, res] = await to(
        axios.post(this.api_uri, {
          jsonrpc: "2.0",
          method,
          params,
          id: 0,
        }),
      );
      if (err) return [err, undefined];
      if (res?.data?.error?.message === "Access denied") {
        console.warn(
          `[glinet:api] Access denied for api call ${JSON.stringify(params)}`,
        );
        if (this.sid) {
          this.sid = "";
          return this.api.post(params);
        }
      }

      return [err, res];
    },
  };
  location = {
    current: {} as any,
    get_location: async () => {
      const [err, response] = await to(axios.get("http://ip-api.com/json"));
      if (err) {
        console.error(`[glinet:get_location] ${err}`);
      }
      if (response?.data) {
        const { lat, lon, ...rest } = response.data;
        this.location.current = { latitude: lat, longitude: lon, ...rest };
      }
    },
  };
  modem = {
    tower_info: {} as any,
    cells_info: {} as any,
    info: {} as any,
    sms: {} as any,
    status: {} as any,
    get_cells_info: async () => {
      // if (!Object.keys(this.modem.info).length) await this.modem.get_info();
      this.modem.cells_info = await this.api.call("modem", "get_cells_info", {
        bus: this.modem_bus,
      });
      return this.modem.cells_info;
    },
    get_info: async () => {
      this.modem.info = await this.api.call("modem", "get_info");
      return this.modem.info;
    },
    get_sms_list: async () => {
      this.modem.sms = await this.api.call("modem", "get_sms_list");
      return this.modem.sms;
    },
    get_status: async () => {
      if (!Object.keys(this.modem.info).length) await this.modem.get_info();
      this.modem.status = await this.api.call("modem", "get_status");
      return this.modem.status;
    },
    get_tower_info: async () => {
      const resp = await Promise.all([
        this.modem.send_at_command("AT+QNWINFO"),
        this.modem.send_at_command("AT+CEREG?"),
      ]);

      let info: any = { cmd: {} };

      if (typeof resp[0] === "string" && resp[0].includes("OK")) {
        const result = resp[0].split("\r\n")[1].split(": ");
        const cmd = result[0];
        const raw = result[1].replaceAll('"', "").split(",");

        const cell = {
          type: raw[0],
          band: raw[2],
          mcc: Number(raw[1]?.slice(0, 3)),
          mnc: Number(raw[1]?.slice(3)),
          freq: Number(raw[3]),
        };

        info.cmd[`AT${cmd}`] = result[1];
        info = Object.assign(info, cell);
      }
      if (typeof resp[1] === "string" && resp[1].includes("OK")) {
        const result = resp[1].split("\r\n")[1].split(": ");
        const cmd = result[0];
        const raw = result[1].replaceAll('"', "").split(",");

        const cell = {
          lac: parseInt(raw[2], 16),
          cellId: raw[3],
          eNBId: parseInt(raw[3]?.slice(0, -2), 16),
          sector: parseInt(raw[3]?.slice(-2), 16),
        };
        info.cmd[`AT${cmd}`] = result[1];
        info = Object.assign(info, cell);
      }

      const url = `https://api.cellmapper.net/v6/getTowerInformation?MCC=${
        info.mcc
      }&MNC=${info.mnc}&Region=${info.lac}&Site=${info.eNBId}&RAT=${
        info.band.split(" ")[0]
      }`;
      info.url = url;
      this.modem.tower_info = info;
      return this.modem.tower_info;
    },
    send_at_command: async (command: string) => {
      const at = await this.api.call("modem", "send_at_command", {
        bus: this.modem_bus,
        command,
        port: this.modem_port,
      });
      return at.result.response;
    },
    send_sms: async ({
      body = this.smsBody,
      phone_number = this.smsPhoneNumber,
    }: {
      body?: string;
      phone_number?: string;
    } = {}) => {
      const payload = {
        body,
        bus: this.modem_bus,
        phone_number,
        sender: this.phone_number,
        timeout: 0,
      };
      const sms = await this.api.call("modem", "send_sms", payload);
      return { ...(sms || {}), payload };
    },
  };
  system = {
    info: {} as any,
    status: {} as any,
    get_info: async () => {
      this.system.info = await this.api.call("system", "get_info");
      return this.system.info;
    },
    get_status: async () => {
      if (!Object.keys(this.system.info).length) await this.system.get_info();
      this.system.status = await this.api.call("system", "get_status");
      return this.system.status;
    },
    reboot: async () => {
      const [err, res] = await this.api.post([, "system", "reboot"]);
      if (err) throw err;
      if (res.status > 200 && res.status < 400)
        console.log("Restarting router...");
    },
  };

  refresh = async () => {
    const { location, modem, system } = this;
    await system.get_status();
    const apiCalls = [
      location.get_location,
      modem.get_status,
      modem.get_cells_info,
      modem.get_tower_info,
      modem.get_sms_list,
    ];

    // Make the API calls sequentially (takes longer)
    if (process.env.GLINET_SEQUENTIAL_API)
      for (const apiCall of apiCalls) await apiCall();
    // Make all API calls in parallel (default)
    else await Promise.all(apiCalls.map((op) => op()));

    this.publish();

    return this.state;
  };

  publish = async () => {
    // requires process.env.MQTT_HOST set otherwise this safely does nothing
    if (Object.keys(this.system.status).length && !mqtt.client)
      await mqtt.init(this);
    if (mqtt.client) await mqtt.publish();
  };

  login = async () => {
    try {
      // Step1: Get encryption parameters by challenge method
      const [challengeErr, challengeResponse] = await this.api.post(
        {
          username: this.username,
        },
        "challenge",
      );
      if (challengeErr) throw challengeErr;

      const result = challengeResponse.data.result || {};
      const alg = result.alg;
      const salt = result.salt;
      const nonce = result.nonce;

      // Step2: Generate cipher text using openssl algorithm
      const cipherPassword = up.crypt(
        this.password,
        "$" + alg + "$" + salt + "$",
      );

      // Step3: Generate hash values for login
      const data = `${this.username}:${cipherPassword}:${nonce}`;
      const hash_value = crypto
        .createHash("sha256")
        .update(data, "utf-8")
        .digest("hex");

      // Step4: Get sid by login
      const [loginErr, loginResponse] = await this.api.post(
        {
          username: "root",
          hash: hash_value,
        },
        "login",
      );

      if (loginErr) throw loginErr;
      if (loginResponse.data.error) {
        console.log(
          `[glinet:login] ${JSON.stringify(loginResponse.data.error)}`,
        );
        if (
          "Login fail number over limit" === loginResponse.data.error.message
        ) {
          const { wait } = loginResponse.data.error.data;
          console.log(
            `[glinet:login] "Login fail number over limit - wait ${wait}"`,
          );
          await sleep((wait + 5) * 1000);
          console.log(`[glinet:login] Retry login after waiting for ${wait}s`);
          await this.login();
        }
      } else if (loginResponse.data.result) {
        this.sid = loginResponse.data.result.sid;
        console.log(
          `[glinet:login] ${JSON.stringify(loginResponse?.data.result)}`,
        );
      }
    } catch (error) {
      console.error(`[glinet:login] ${error}`);
      throw error;
    }
  };

  // script = async () => {
  //   // Step1: Get encryption parameters by challenge method
  //   axios
  //     .post(this.api_uri, {
  //       jsonrpc: "2.0",
  //       method: "challenge",
  //       params: {
  //         username: this.username,
  //       },
  //       id: 0,
  //     })
  //     .then((response) => {
  //       const result = response.data.result;
  //       const alg = result.alg;
  //       const salt = result.salt;
  //       const nonce = result.nonce;

  //       // Step2: Generate cipher text using openssl algorithm
  //       const cipherPassword = up.crypt(
  //         this.password,
  //         "$" + alg + "$" + salt + "$"
  //       );

  //       // Step3: Generate hash values for login
  //       const data = `${this.username}:${cipherPassword}:${nonce}`;
  //       const hash_value = crypto.createHash("md5").update(data).digest("hex");

  //       // Step4: Get sid by login
  //       axios
  //         .post(this.api_uri, {
  //           jsonrpc: "2.0",
  //           method: "login",
  //           params: {
  //             username: "root",
  //             hash: hash_value,
  //           },
  //           id: 0,
  //         })
  //         .then((response) => {
  //           const sid = response.data.result.sid;

  //           // Step5: Calling other APIs with sid
  //           axios
  //             .post(this.api_uri, {
  //               jsonrpc: "2.0",
  //               method: "call",
  //               params: [sid, "system", "get_status"],
  //               id: 0,
  //             })
  //             .then((response) => {
  //               console.log(JSON.stringify(response.data));
  //               this.system.status = response.data;
  //             })
  //             .catch((error) => {
  //               console.error("Request Exception:", error);
  //             });
  //         })
  //         .catch((error) => {
  //           console.error("Request Exception:", error);
  //         });
  //     })
  //     .catch((error) => {
  //       console.error("Request Exception:", error);
  //     });
  // };
}

export default GlinetController;
