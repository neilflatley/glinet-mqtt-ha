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

process.on("SIGUSR2", async () => {
  console.log("[app] Restarting due to SIGUSR2...");
  
  const operations: Promise<void>[] = [];
  
  if (closeServer) {
    operations.push(
      (async () => {
        try {
          await closeServer();
        } catch (error) {
          console.error(`[app:shutdown] API server error:`, error);
        }
      })()
    );
  }
  
  if (mqtt.client) {
    operations.push(
      (async () => {
        try {
          await mqtt.disconnect();
        } catch (error) {
          console.error(`[app:shutdown] MQTT disconnect error:`, error);
        }
      })()
    );
  }
  
  await Promise.allSettled(operations).catch(() => {});
  
  mqtt.stopPolling();
  
  setTimeout(() => {
    process.kill(process.pid, "SIGUSR2");
  }, 100);
});

// Exit handler for unhandled exits
process.on("exit", async () => {
  console.log("[app] Process exiting, cleaning up...");
  
  if (mqtt.client) {
    try {
      await mqtt.disconnect();
    } catch {
      // Ignore errors during exit
    }
  }
});

// SIGINT handler (Ctrl+C)
process.on("SIGINT", async () => {
  console.log("[app] Shutting down (SIGINT)...");
  await cleanup();
  process.exit(0);
});

// SIGTERM handler (for orchestration)
process.on("SIGTERM", async () => {
  console.log("[app] Shutting down (SIGTERM)...");
  await cleanup();
  process.exit(0);
});

const cleanup = async () => {
  if (closeServer) await closeServer().catch(() => {});
  if (mqtt.client) await mqtt.disconnect().catch(() => {});
};
