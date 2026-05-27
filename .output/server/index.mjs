globalThis.__nitro_main__ = import.meta.url;
import { a as toEventHandler, c as NodeResponse, i as defineLazyEventHandler, l as serve, n as HTTPError, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs").then((n) => n.a)) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/_authenticated-DSszS7mg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cb5-oSwf5+beeTD3FaWtSN7qk5ZBkS0\"",
		"mtime": "2026-05-27T16:44:40.387Z",
		"size": 3253,
		"path": "../public/assets/_authenticated-DSszS7mg.js"
	},
	"/assets/adicionar-CzikvIQs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"238-eSq/T/yhB3ycSxZiEmkijuBFG3g\"",
		"mtime": "2026-05-27T16:44:40.387Z",
		"size": 568,
		"path": "../public/assets/adicionar-CzikvIQs.js"
	},
	"/assets/auth-D8e1xzqO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ad-yEO57zcds3Sc9yX4CIzNU13y/ZI\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 429,
		"path": "../public/assets/auth-D8e1xzqO.js"
	},
	"/vercel.svg": {
		"type": "image/svg+xml",
		"etag": "\"275-OP79UnYghzbrnUPs1QzuCL9W+80\"",
		"mtime": "2026-05-27T16:44:40.554Z",
		"size": 629,
		"path": "../public/vercel.svg"
	},
	"/assets/backgroundLogin-DQPlZIA5.png": {
		"type": "image/png",
		"etag": "\"a65b-8jJm0hjMzVxVep6HrKbxP43Ifx0\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 42587,
		"path": "../public/assets/backgroundLogin-DQPlZIA5.png"
	},
	"/assets/auth-p2mFWy55.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"11df-8FbcHMQ+xgp+Sf4/gXf+51zBj8E\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 4575,
		"path": "../public/assets/auth-p2mFWy55.js"
	},
	"/assets/contracts-DcHSrXBf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3ad-tPTgRE15W0HyHmYbIJRA5dFqvPY\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 941,
		"path": "../public/assets/contracts-DcHSrXBf.js"
	},
	"/assets/contratos-CzgDDn0v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1834-Ae6ujk+YfGJqoQCrsvDMhtgn2SA\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 6196,
		"path": "../public/assets/contratos-CzgDDn0v.js"
	},
	"/assets/detalhes._id-mpyYeG9Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b35-X5AWIlk1lbPWFpX3scal7eL6f6s\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 2869,
		"path": "../public/assets/detalhes._id-mpyYeG9Q.js"
	},
	"/assets/globals-Htf8nPXR.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"cbaa-nKgKULSTAuPnv0YPZFAhFrMHYL8\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 52138,
		"path": "../public/assets/globals-Htf8nPXR.css"
	},
	"/assets/login-DI8vc2pN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"be1-RjMpuBsBQZTUUwFI56dTkIQp0Bg\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 3041,
		"path": "../public/assets/login-DI8vc2pN.js"
	},
	"/assets/ContractForm-ORItVw8b.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"245f-VBe7ONd1x8FsTka6J3ZM3++ugKc\"",
		"mtime": "2026-05-27T16:44:40.387Z",
		"size": 9311,
		"path": "../public/assets/ContractForm-ORItVw8b.js"
	},
	"/assets/editar._id-HPXt8Sv0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"529-3GhHjstBx+6ssfEnVas2oSBiypo\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 1321,
		"path": "../public/assets/editar._id-HPXt8Sv0.js"
	},
	"/assets/historico._id-BVI1_InP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3eb-4ks6YcpiMx9qQphWfY3fguXXZLA\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 1003,
		"path": "../public/assets/historico._id-BVI1_InP.js"
	},
	"/assets/queries-D0YZd_1A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b-/VPivnAUvbccDslvrJSYMU7iQjo\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 155,
		"path": "../public/assets/queries-D0YZd_1A.js"
	},
	"/assets/use-contract-DLPL-CRj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e4-3WtL72FCzJXfG/aYWDpi6uaJ/nk\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 228,
		"path": "../public/assets/use-contract-DLPL-CRj.js"
	},
	"/assets/useBaseQuery-CDl06UAY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33da-Pf1NS9EyIu7CWN0iF8ln48OaMn8\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 13274,
		"path": "../public/assets/useBaseQuery-CDl06UAY.js"
	},
	"/assets/useSuspenseQuery-Ba5FyjNJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ae-IDmJ+D6Eu1uq9HC2G1pN70DoZ1c\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 174,
		"path": "../public/assets/useSuspenseQuery-Ba5FyjNJ.js"
	},
	"/assets/useMutation-WR-8RDCr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"955-VXEvaFJ6p0y2AwN+AO32OHlJaUo\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 2389,
		"path": "../public/assets/useMutation-WR-8RDCr.js"
	},
	"/assets/useQuery-s99wqSnU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"60-vlNqzE+znPZMwOBqjbCDVTgV+u0\"",
		"mtime": "2026-05-27T16:44:40.388Z",
		"size": 96,
		"path": "../public/assets/useQuery-s99wqSnU.js"
	},
	"/assets/index-Dy2igzsP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6075f-SY8AUJ6dNvfxYqR5oafB74OsGFA\"",
		"mtime": "2026-05-27T16:44:40.387Z",
		"size": 395103,
		"path": "../public/assets/index-Dy2igzsP.js"
	},
	"/next.svg": {
		"type": "image/svg+xml",
		"etag": "\"55f-Pz6VYiYSuYnFvWoDKZowjG88fms\"",
		"mtime": "2026-05-27T16:44:40.554Z",
		"size": 1375,
		"path": "../public/next.svg"
	},
	"/images/BradescoImg.png": {
		"type": "image/png",
		"etag": "\"3731-aWhe2o9ri3GtJmxfwAEACDAqjPk\"",
		"mtime": "2026-05-27T16:44:40.553Z",
		"size": 14129,
		"path": "../public/images/BradescoImg.png"
	},
	"/images/Sorting.svg": {
		"type": "image/svg+xml",
		"etag": "\"1b2-UwRsDbdo20NzWKzfrgjFr2zZ1sg\"",
		"mtime": "2026-05-27T16:44:40.553Z",
		"size": 434,
		"path": "../public/images/Sorting.svg"
	},
	"/images/Search.svg": {
		"type": "image/svg+xml",
		"etag": "\"4f4-JQCGIgSJIgn9P8IXkbxf5ILR1Xw\"",
		"mtime": "2026-05-27T16:44:40.553Z",
		"size": 1268,
		"path": "../public/images/Search.svg"
	},
	"/images/logo_background.png": {
		"type": "image/png",
		"etag": "\"98b-x+X5Q3B86VbxC1tJzpbGkD7dV1w\"",
		"mtime": "2026-05-27T16:44:40.553Z",
		"size": 2443,
		"path": "../public/images/logo_background.png"
	},
	"/images/logo-bem-comum.png": {
		"type": "image/png",
		"etag": "\"f13-+6xi980igdtPcfcIqp4ehDn8yrw\"",
		"mtime": "2026-05-27T16:44:40.553Z",
		"size": 3859,
		"path": "../public/images/logo-bem-comum.png"
	},
	"/images/logo-bem-comum-big.png": {
		"type": "image/png",
		"etag": "\"63e3-h4o+u7Vfo07Bnn0JLw8cdxZ6stY\"",
		"mtime": "2026-05-27T16:44:40.554Z",
		"size": 25571,
		"path": "../public/images/logo-bem-comum-big.png"
	},
	"/images/backgroundLogin.png": {
		"type": "image/png",
		"etag": "\"a65b-8jJm0hjMzVxVep6HrKbxP43Ifx0\"",
		"mtime": "2026-05-27T16:44:40.553Z",
		"size": 42587,
		"path": "../public/images/backgroundLogin.png"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_TIDFTj = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_TIDFTj
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
