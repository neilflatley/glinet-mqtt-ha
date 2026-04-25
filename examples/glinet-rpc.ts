import axios from "axios";
import crypto from "crypto";
import up from "unixpass";
const api_uri = "http://192.168.8.1/rpc";
const username = "root";
const password = "MyPassword";

const script = async () => {
  // Step1: Get encryption parameters by challenge method
  axios
    .post(api_uri, {
      jsonrpc: "2.0",
      method: "challenge",
      params: {
        username: username,
      },
      id: 0,
    })
    .then((response) => {
      const result = response.data.result;
      const alg = result.alg;
      const salt = result.salt;
      const nonce = result.nonce;

      // Step2: Generate cipher text using openssl algorithm
      const cipherPassword = up.crypt(password, "$" + alg + "$" + salt + "$");

      // Step3: Generate hash values for login
      const data = `${username}:${cipherPassword}:${nonce}`;
      const hash_value = crypto.createHash("md5").update(data).digest("hex");

      // Step4: Get sid by login
      axios
        .post(api_uri, {
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
            .post(api_uri, {
              jsonrpc: "2.0",
              method: "call",
              params: [sid, "system", "get_status"],
              id: 0,
            })
            .then((response) => {
              console.log(JSON.stringify(response.data, null, 2));
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
