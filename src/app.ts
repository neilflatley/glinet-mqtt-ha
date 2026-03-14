import GlinetController from "./controller.js";

const isApi = !(
  process.env.GLINET_API === "false" || process.env.GLINET_API === "0"
);

const router = new GlinetController();
await router.refresh();

if (isApi) {
  const { default: GlinetApi } = await import("./api.js");
  await GlinetApi(router);
}
