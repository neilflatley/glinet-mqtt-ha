import { to } from "await-to-js";
import { mqtt } from "./mqtt";
import { sleep } from "./util";
import axios from "axios";
import up from "unixpass";
import crypto from "crypto";

class GlinetController {
  private host = "192.168.8.1";
  private username = "root";

  private password = "MyPassword";
  private routerUri = `http://${this.host}`;

  get api_uri() {
    return `${this.routerUri}/rpc`;
  }

  info: any;
  status: any;
  sid?: string; // Token to connect to router

  constructor(
    host = process.env.GLINET_HOST,
    password = process.env.GLINET_PASSWORD
  ) {
    if (password) this.password = password;
    this.host = host || this.host;
    this.routerUri = `http://${this.host}`;
    console.log(`Connecting to ${this.routerUri}`);
  }

  post = async (
    params: [string | undefined, string, string] | { [param: string]: string },
    method = "call"
  ) => {
    if (method === "call" && !this.sid) await this.login();
    // Add latest sid to first array param
    if (Array.isArray(params)) params[0] = this.sid;

    return to(
      axios.post(this.api_uri, {
        jsonrpc: "2.0",
        method,
        params,
        id: 0,
      })
    );
  };

  publish = async () => {
    // requires process.env.MQTT_HOST set otherwise this safely does nothing
    const { status = {}, info = {} } = this;

    if (status && !mqtt.client) await mqtt.init(this);
    if (mqtt.client) await mqtt.publish(JSON.stringify({ ...status, ...info }));
  };

  refreshInfo = async () => {
    const [err, res] = await this.post([this.sid, "system", "get_info"]);
    if (err) throw err;
    this.info = res.data;
    return this.status;
  };

  refreshStatus = async () => {
    if (!this.info) await this.refreshInfo();
    const [err, res] = await this.post([this.sid, "system", "get_status"]);
    if (err) throw err;
    this.status = res.data;
    return this.status;
  };

  login = async () => {
    try {
      // Step1: Get encryption parameters by challenge method
      const [challengeErr, challengeResponse] = await this.post(
        {
          username: this.username,
        },
        "challenge"
      );
      if (challengeErr) throw challengeErr;

      const result = challengeResponse.data.result;
      const alg = result.alg;
      const salt = result.salt;
      const nonce = result.nonce;

      // Step2: Generate cipher text using openssl algorithm
      const cipherPassword = up.crypt(
        this.password,
        "$" + alg + "$" + salt + "$"
      );

      // Step3: Generate hash values for login
      const data = `${this.username}:${cipherPassword}:${nonce}`;
      const hash_value = crypto.createHash("md5").update(data).digest("hex");

      // Step4: Get sid by login
      const [loginErr, loginResponse] = await this.post(
        {
          username: "root",
          hash: hash_value,
        },
        "login"
      );

      if (loginErr) throw loginErr;
      this.sid = loginResponse.data.result.sid;
      console.log(
        `[glinet:login] ${JSON.stringify(loginResponse.data.result)}`
      );
    } catch (error) {
      console.error(`[glinet:login] ${error}`);
      throw error;
    }
  };

  reboot = async () => {
    const [err, res] = await this.post([, "system", "reboot"]);
    if (err) throw err;
    if (res.status > 200 && res.status < 400)
      console.log("Restarting router...");
  };

  // readSms = async () => {
  //   if (this.user_role !== "Admin") {
  //     await this.login();
  //   }
  //   if (this.user_role !== "Admin") {
  //     throw new Error(
  //       `Cannot read sms unless user_role is Admin - user_role: ${this.user_role}`
  //     );
  //   } else {
  //     return this.status?.sms;
  //   }
  // };

  // sendSms = async ({
  //   message = this.message,
  //   recipient = this.recipient,
  // }: {
  //   message?: string;
  //   recipient?: string;
  // } = {}) => {
  //   console.log(`[sms] send ${recipient} "${message}"`);
  //   if (this.user_role !== "Admin") {
  //     await this.login();
  //   }
  //   if (this.user_role !== "Admin") {
  //     throw new Error(
  //       `Cannot send sms unless user_role is Admin - user_role: ${this.user_role}`
  //     );
  //   } else if (!message || !recipient) {
  //     throw new Error(`Cannot send sms required input(s) missing`);
  //   } else {
  //     const [err, res] = await this.post({
  //       url: this.send_sms_uri,
  //       jar: this.jar,
  //       form: {
  //         token: this.token,
  //         action: "send",
  //         "sms.sendMsg.clientId": "netgear_aircard_rest",
  //         "sms.sendMsg.receiver": recipient,
  //         "sms.sendMsg.text": message,
  //       },
  //     });
  //     if (err) throw err;
  //     if (res.statusCode > 200 && res.statusCode < 400)
  //       console.log(
  //         `[sms] send ${res.statusCode} ${res.statusMessage} ${res.headers?.location}`
  //       );
  //   }
  // };

  script = async () => {
    // Step1: Get encryption parameters by challenge method
    axios
      .post(this.api_uri, {
        jsonrpc: "2.0",
        method: "challenge",
        params: {
          username: this.username,
        },
        id: 0,
      })
      .then((response) => {
        const result = response.data.result;
        const alg = result.alg;
        const salt = result.salt;
        const nonce = result.nonce;

        // Step2: Generate cipher text using openssl algorithm
        const cipherPassword = up.crypt(
          this.password,
          "$" + alg + "$" + salt + "$"
        );

        // Step3: Generate hash values for login
        const data = `${this.username}:${cipherPassword}:${nonce}`;
        const hash_value = crypto.createHash("md5").update(data).digest("hex");

        // Step4: Get sid by login
        axios
          .post(this.api_uri, {
            jsonrpc: "2.0",
            method: "login",
            params: {
              username: "root",
              hash: hash_value,
            },
            id: 0,
          })
          .then((response) => {
            const sid = response.data.result.sid;

            // Step5: Calling other APIs with sid
            axios
              .post(this.api_uri, {
                jsonrpc: "2.0",
                method: "call",
                params: [sid, "system", "get_status"],
                id: 0,
              })
              .then((response) => {
                console.log(JSON.stringify(response.data));
                this.status = response.data;
              })
              .catch((error) => {
                console.error("Request Exception:", error);
              });
          })
          .catch((error) => {
            console.error("Request Exception:", error);
          });
      })
      .catch((error) => {
        console.error("Request Exception:", error);
      });
  };
}

export default GlinetController;
