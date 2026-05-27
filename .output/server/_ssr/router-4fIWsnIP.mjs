import { T as redirect, a as createRouter, c as createFileRoute, l as createRootRoute, n as Scripts, o as Outlet, r as HeadContent, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as Route$4 } from "./contratos-CnF_yVY1.mjs";
import { t as Route$5 } from "./detalhes._id-n0bseNnB.mjs";
import { t as Route$6 } from "./editar._id-BmuOPjng.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-4fIWsnIP.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var globals_default = "/assets/globals-oPjg1nyp.css";
var _jsxFileName = "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx";
var Route$3 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "ERP Financeiro" }
		],
		links: [{
			rel: "stylesheet",
			href: globals_default
		}]
	}),
	beforeLoad: ({ location }) => {
		if (location.pathname === "/") throw redirect({ to: "/login" });
	},
	component: RootLayout
});
function RootLayout() {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("head", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(HeadContent, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 39,
			columnNumber: 9
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 38,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("body", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 42,
			columnNumber: 9
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Scripts, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 43,
			columnNumber: 9
		}, this)] }, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 41,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 37,
		columnNumber: 5
	}, this);
}
var $$splitComponentImporter$2 = () => import("./login-Bx62YzOs.mjs");
var Route$2 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("../_authenticated-Dbxpgdqd.mjs");
var Route$1 = createFileRoute("/_authenticated")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./adicionar-DvD0kfj9.mjs");
var Route = createFileRoute("/_authenticated/contratos/adicionar")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var LoginRoute = Route$2.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$3
});
var AuthenticatedRoute = Route$1.update({
	id: "/_authenticated",
	getParentRoute: () => Route$3
});
var AuthenticatedContratosIndexRoute = Route$4.update({
	id: "/contratos/",
	path: "/contratos/",
	getParentRoute: () => AuthenticatedRoute
});
var AuthenticatedContratosAdicionarRoute = Route.update({
	id: "/contratos/adicionar",
	path: "/contratos/adicionar",
	getParentRoute: () => AuthenticatedRoute
});
var AuthenticatedContratosEditarIdRoute = Route$6.update({
	id: "/contratos/editar/$id",
	path: "/contratos/editar/$id",
	getParentRoute: () => AuthenticatedRoute
});
var AuthenticatedRouteChildren = {
	AuthenticatedContratosAdicionarRoute,
	AuthenticatedContratosIndexRoute,
	AuthenticatedContratosDetalhesIdRoute: Route$5.update({
		id: "/contratos/detalhes/$id",
		path: "/contratos/detalhes/$id",
		getParentRoute: () => AuthenticatedRoute
	}),
	AuthenticatedContratosEditarIdRoute
};
var rootRouteChildren = {
	AuthenticatedRoute: AuthenticatedRoute._addFileChildren(AuthenticatedRouteChildren),
	LoginRoute
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true
	});
}
//#endregion
export { getRouter };
