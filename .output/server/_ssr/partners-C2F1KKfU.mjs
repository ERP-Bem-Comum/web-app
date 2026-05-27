import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { n as env, r as resultFetch, t as createServerRpc } from "./result-fetch-eo8vxO5I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/partners-C2F1KKfU.js
var getSuppliers_createServerFn_handler = createServerRpc({
	id: "0d9b80a34af217f62297b399d76eb7313d7df3d6925d21bdd62062ad8058708f",
	name: "getSuppliers",
	filename: "src/server/partners.ts"
}, (opts) => getSuppliers.__executeServer(opts));
var getSuppliers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSuppliers_createServerFn_handler, async ({ context }) => {
	const res = await resultFetch(`${env.API_URL}/suppliers`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to fetch suppliers", { status: 500 });
	}
	return res.value.json();
});
var getFinanciers_createServerFn_handler = createServerRpc({
	id: "666756a0e76fe00602f7fa76d7149af817707b657e54b173683e536081ac87ae",
	name: "getFinanciers",
	filename: "src/server/partners.ts"
}, (opts) => getFinanciers.__executeServer(opts));
var getFinanciers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getFinanciers_createServerFn_handler, async ({ context }) => {
	const res = await resultFetch(`${env.API_URL}/financiers`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to fetch financiers", { status: 500 });
	}
	return res.value.json();
});
var getCollaborators_createServerFn_handler = createServerRpc({
	id: "b6a4cdca5db852fb11e1a1787a8006323156ca732a1c913aff9246492272622e",
	name: "getCollaborators",
	filename: "src/server/partners.ts"
}, (opts) => getCollaborators.__executeServer(opts));
var getCollaborators = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getCollaborators_createServerFn_handler, async ({ context }) => {
	const res = await resultFetch(`${env.API_URL}/collaborators`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to fetch collaborators", { status: 500 });
	}
	return res.value.json();
});
//#endregion
export { getCollaborators_createServerFn_handler, getFinanciers_createServerFn_handler, getSuppliers_createServerFn_handler };
