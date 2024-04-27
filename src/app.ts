import GlinetController from "./controller.ts";
import GlinetApi from "./api.ts";
const isApi = !(process.env.GLINET_API === 'false' || process.env.GLINET_API === '0')

const router = new GlinetController();
await router.refresh();

if (isApi) await GlinetApi(router);
