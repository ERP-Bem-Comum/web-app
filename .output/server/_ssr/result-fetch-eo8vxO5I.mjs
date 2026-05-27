import { t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { c as object, l as string, n as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/result-fetch-eo8vxO5I.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var env = object({
	API_URL: string().min(1),
	AUTH_SECRET: string().min(1),
	NODE_ENV: _enum([
		"development",
		"production",
		"test"
	]).default("development")
}).parse({
	API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4010",
	AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "",
	NODE_ENV: "production"
});
async function resultFetch(input, init) {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3e4);
		const response = await fetch(input, {
			...init,
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (!response.ok) {
			let body;
			try {
				body = await response.json();
			} catch {
				body = await response.text();
			}
			return {
				ok: false,
				error: {
					kind: "http",
					status: response.status,
					body
				}
			};
		}
		return {
			ok: true,
			value: response
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") return {
			ok: false,
			error: {
				kind: "timeout",
				message: "Request timed out after 30s"
			}
		};
		return {
			ok: false,
			error: {
				kind: "network",
				message: error instanceof Error ? error.message : "Network error"
			}
		};
	}
}
//#endregion
export { env as n, resultFetch as r, createServerRpc as t };
