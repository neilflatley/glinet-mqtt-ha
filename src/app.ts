import Fastify, { FastifyInstance } from "fastify";
import GlinetController from "./controller.js";
import { mqtt } from "./mqtt.js";

const router = new GlinetController();
await router.refresh();

const server: FastifyInstance = Fastify({
  logger: false,
});

server.get("/ping", async (request, reply) => {
  reply.type("application/json").code(200);
  return { pong: "ok" };
});

server.get("/call", async (request, reply) => {
  try {
    const params = JSON.parse((request.query as any).params) || [];
    const [err, resp] = await router.api.post(params);

    reply.type("application/json").code(200);
    return resp?.data;
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { error: `${error}` };
  }
});

server.get("/ha-devices", async (request, reply) => {
  try {
    reply.type("application/json").code(200);
    return mqtt.devices;
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { error: `${error}` };
  }
});

server.get("/ha-attribute", async (request, reply) => {
  try {
    const attribute = router.state;

    reply.type("application/json").code(200);
    return attribute;
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { error: `${error}` };
  }
});

server.get("/refresh", async (request, reply) => {
  try {
    await router.refresh();

    reply.type("application/json").code(200);
    return router.state;
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { error: `${error}` };
  }
});

server.get("/status", async (request, reply) => {
  try {
    await router.system.get_status();
    router.publish();

    reply.type("application/json").code(200);
    return router.system.status;
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { error: `${error}` };
  }
});

server.get("/login", async (request, reply) => {
  try {
    await router.login();

    reply.type("application/json").code(200);
    return router.state;
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { login: "error", error: `${error}` };
  }
});

server.get("/reboot", async (request, reply) => {
  try {
    console.log("going to reboot the router now");
    await router.system.reboot();
    reply.type("application/json").code(200);
    return { reboot: "ok" };
  } catch (error) {
    console.log(error);

    reply.type("application/json").code(500);
    return { reboot: "error", error: `${error}` };
  }
});

server.post<{ Body: { reboot: "ok" } }>(
  "/reboot",
  {
    schema: {
      body: {
        type: "object",
        required: ["reboot"],
        properties: {
          reboot: { type: "string" },
        },
      },
    },
  },
  async (request, reply) => {
    try {
      if (request.body.reboot === "ok") {
        console.log("going to reboot the router now");
        await router.system.reboot();
        reply.type("application/json").code(200);
        return { reboot: "ok" };
      } else {
        router.publish();
        return;
      }
    } catch (error) {
      console.log(error);

      reply.type("application/json").code(500);
      return { reboot: "error", error: `${error}` };
    }
  }
);

// server.get("/sms", async (request, reply) => {
//   try {
//     await router.readSms();
//     router.publish();

//     reply.type("application/json").code(200);
//     return router.status.sms;
//   } catch (error) {
//     console.log(error);

//     reply.type("application/json").code(500);
//     return { sms: "error", error };
//   }
// });

// server.post<{ Body: { message: string; recipient: string } }>(
//   "/sms",
//   {
//     schema: {
//       body: {
//         type: "object",
//         required: ["recipient", "message"],
//         properties: {
//           message: { type: "string" },
//           recipient: { type: "string" },
//         },
//       },
//     },
//   },
//   async (request, reply) => {
//     try {
//       const { message, recipient } = request.body;
//       if (recipient && message) {
//         await router.sendSms({ message, recipient });
//         reply.type("application/json").code(200);
//         return { sms: "ok", recipient, message };
//       } else {
//         router.publish();
//         return;
//       }
//     } catch (error) {
//       console.log(error);

//       reply.type("application/json").code(500);
//       return { sms: "error", error };
//     }
//   }
// );
const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

await start();

process.on("exit", (code) => {
  server.log.info(`Server restarting. Code:${code}`);
});

// this is the signal that nodemon uses
process.once("SIGUSR2", () => {
  server.log.info("Server restarting");
  process.kill(process.pid, "SIGUSR2");
});
