import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { c as object, s as number } from "../_libs/zod.mjs";
import { n as ContractCreateInputSchema, r as ContractListFiltersSchema } from "./schemas-B7PGPTHM.mjs";
import { n as env, r as resultFetch, t as createServerRpc } from "./result-fetch-eo8vxO5I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contracts-oc8XREmR.js
var getContracts_createServerFn_handler = createServerRpc({
	id: "21733bb734508896bbab990a0be92be590eda23a3dc18baa44f8b5be6a987915",
	name: "getContracts",
	filename: "src/server/contracts.ts"
}, (opts) => getContracts.__executeServer(opts));
var getContracts = createServerFn({ method: "GET" }).middleware([authMiddleware]).inputValidator(ContractListFiltersSchema).handler(getContracts_createServerFn_handler, async ({ data, context }) => {
	const params = new URLSearchParams();
	if (data.page) params.set("page", String(data.page));
	if (data.limit) params.set("limit", String(data.limit));
	if (data.search) params.set("search", data.search);
	if (data.budgetPlanId) params.set("budgetPlanId", String(data.budgetPlanId));
	if (data.contractPeriodStart) params.set("contractPeriodStart", data.contractPeriodStart);
	if (data.contractPeriodEnd) params.set("contractPeriodEnd", data.contractPeriodEnd);
	if (data.contractType) params.set("contractType", data.contractType);
	if (data.contractStatus) params.set("contractStatus", data.contractStatus);
	if (data.order) params.set("order", data.order);
	const res = await resultFetch(`${env.API_URL}/contracts?${params.toString()}`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to fetch contracts", { status: 500 });
	}
	return res.value.json();
});
var GetByIdSchema = object({ id: number() });
var getContractById_createServerFn_handler = createServerRpc({
	id: "757f217f9735179dc68295ed6e2e2f300587be0b0c2d6c7e6bbc1c6dbad7d672",
	name: "getContractById",
	filename: "src/server/contracts.ts"
}, (opts) => getContractById.__executeServer(opts));
var getContractById = createServerFn({ method: "GET" }).middleware([authMiddleware]).inputValidator(GetByIdSchema).handler(getContractById_createServerFn_handler, async ({ data, context }) => {
	const res = await resultFetch(`${env.API_URL}/contracts/${data.id}`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http" && res.error.status === 404) throw new Response("Contract not found", { status: 404 });
		throw new Response("Failed to fetch contract", { status: 500 });
	}
	return res.value.json();
});
var createContract_createServerFn_handler = createServerRpc({
	id: "2c5d88086f299976e460e81001cd34c04430a9183d8dc21948bb4170c781b47b",
	name: "createContract",
	filename: "src/server/contracts.ts"
}, (opts) => createContract.__executeServer(opts));
var createContract = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(ContractCreateInputSchema).handler(createContract_createServerFn_handler, async ({ data, context }) => {
	const res = await resultFetch(`${env.API_URL}/contracts`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${context.session.token}`
		},
		body: JSON.stringify(data)
	});
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to create contract", { status: 500 });
	}
	return res.value.json();
});
var updateContract_createServerFn_handler = createServerRpc({
	id: "fed5490d1d1091454d5fe759b357ccec82911572e748dc87b8cf48551d1c7ad4",
	name: "updateContract",
	filename: "src/server/contracts.ts"
}, (opts) => updateContract.__executeServer(opts));
var updateContract = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(ContractCreateInputSchema.extend({ id: number() })).handler(updateContract_createServerFn_handler, async ({ data, context }) => {
	const { id, ...body } = data;
	const res = await resultFetch(`${env.API_URL}/contracts/${id}`, {
		method: "PUT",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${context.session.token}`
		},
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to update contract", { status: 500 });
	}
	return res.value.json();
});
var deleteContract_createServerFn_handler = createServerRpc({
	id: "3842accf9e7e47a59d74742faf0e58ae1b9d1c3aae28536d1c848b9ef60c2cc7",
	name: "deleteContract",
	filename: "src/server/contracts.ts"
}, (opts) => deleteContract.__executeServer(opts));
var deleteContract = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(object({ id: number() })).handler(deleteContract_createServerFn_handler, async ({ data, context }) => {
	const res = await resultFetch(`${env.API_URL}/contracts/${data.id}`, {
		method: "DELETE",
		headers: { authorization: `Bearer ${context.session.token}` }
	});
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to delete contract", { status: 500 });
	}
	return { success: true };
});
var createAditive_createServerFn_handler = createServerRpc({
	id: "362cb3e91c809b23fa9aa028a9af6edeee9f16e7e614ba712b3b4e936d33854a",
	name: "createAditive",
	filename: "src/server/contracts.ts"
}, (opts) => createAditive.__executeServer(opts));
var createAditive = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(ContractCreateInputSchema).handler(createAditive_createServerFn_handler, async ({ data, context }) => {
	const res = await resultFetch(`${env.API_URL}/contracts/aditive`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${context.session.token}`
		},
		body: JSON.stringify(data)
	});
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Failed to create aditive", { status: 500 });
	}
	return res.value.json();
});
var getContractHistory_createServerFn_handler = createServerRpc({
	id: "3ad6ac5a0a6984a4132c4eed501205fa0c56f2e1c01a6eeec70870aa8f2f0a55",
	name: "getContractHistory",
	filename: "src/server/contracts.ts"
}, (opts) => getContractHistory.__executeServer(opts));
var getContractHistory = createServerFn({ method: "GET" }).middleware([authMiddleware]).inputValidator(object({ id: number() })).handler(getContractHistory_createServerFn_handler, async ({ data, context }) => {
	const res = await resultFetch(`${env.API_URL}/contracts/history/${data.id}`, { headers: { authorization: `Bearer ${context.session.token}` } });
	if (!res.ok) {
		if (res.error.kind === "http" && res.error.status === 404) throw new Response("Contract not found", { status: 404 });
		throw new Response("Failed to fetch contract history", { status: 500 });
	}
	return res.value.json();
});
//#endregion
export { createAditive_createServerFn_handler, createContract_createServerFn_handler, deleteContract_createServerFn_handler, getContractById_createServerFn_handler, getContractHistory_createServerFn_handler, getContracts_createServerFn_handler, updateContract_createServerFn_handler };
