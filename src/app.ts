import GlinetController from "./controller.js";
import { mqtt } from "./mqtt.js";

const isApi = !(
  process.env.GLINET_API === "false" || process.env.GLINET_API === "0"
);

const router = new GlinetController();
await router.refresh();

let closeServer: (() => Promise<void>) | undefined;

if (isApi) {
  const { default: GlinetApi } = await import("./api.js");
  const { closeServer: serverClose } = await GlinetApi(router);
  closeServer = serverClose;
}

process.on("SIGUSR2", () => {
  console.log("[app] Restarting due to SIGUSR2...");
  
  if (closeServer) {
    closeServer();
  }
  
  mqtt.stopPolling();
  
  setTimeout(() => {
    process.kill(process.pid, "SIGUSR2");
  }, 100);
});
