import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { n as env, r as resultFetch, t as createServerRpc } from "./result-fetch-eo8vxO5I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/budget-plans-p2SC1xTu.js
var getBudgetPlans_createServerFn_handler = createServerRpc({
	id: "88b31d291b303759492a92f08c8227473d8bce7cd77b41cf5af04c5d3dfc3f47",
	name: "getBudgetPlans",
	filename: "src/server/budget-plans.ts"
}, (opts) => getBudgetPlans.__executeServer(opts));
var getBudgetPlans = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getBudgetPlans_createServerFn_handler, async ({ context }) => {
	const res = await resultFetch(`${env.API_URL}/budget-plans`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to fetch budget plans", { status: 500 });
	}
	return res.value.json();
});
//#endregion
export { getBudgetPlans_createServerFn_handler };
