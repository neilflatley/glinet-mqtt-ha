import GlinetController from "./controller.js";
import GlinetApi from "./api.js";

const isApi = !(process.env.GLINET_API === 'false' || process.env.GLINET_API === '0')

const router = new GlinetController();
await router.refresh();

if (isApi) await GlinetApi(router);
