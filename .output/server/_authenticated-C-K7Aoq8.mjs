import { r as useQuery } from "./_libs/react+tanstack__react-query.mjs";
import { o as Outlet, u as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as getSession } from "./_ssr/auth-DbW2AatT.mjs";
import { t as require_jsx_dev_runtime } from "./_libs/react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_authenticated-C-K7Aoq8.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
function useAuth() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["auth", "session"],
		queryFn: () => getSession(),
		retry: false,
		refetchOnWindowFocus: false
	});
	return {
		session: data ?? null,
		isLoading,
		isAuthenticated: !!data?.user,
		error
	};
}
var _jsxFileName$1 = "/Users/alessandracastro/dev/ERP-FRONTEND/src/components/layout/main/PageContainer.tsx";
function PageContainer({ children }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "h-full w-full z-0 overflow-hidden min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "h-full w-full py-8 px-4 min-w-0",
			children
		}, void 0, false, {
			fileName: _jsxFileName$1,
			lineNumber: 6,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 5,
		columnNumber: 5
	}, this);
}
var _jsxFileName = "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated.tsx?tsr-split=component";
function AuthenticatedLayout() {
	const { user, logout } = useAuth();
	const handleLogout = async () => {
		await logout({ data: void 0 });
		window.location.href = "/login";
	};
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "w-screen h-screen flex flex-col bg-erp-background",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "bg-white w-full h-[56px] flex justify-between items-center shadow-[0_4px_22px_0px_rgba(0,0,0,0.05)] ps-3 pe-7 z-50",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
				src: "/images/logo-bem-comum.png",
				alt: "Logo",
				width: 32,
				height: 32
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 18,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 17,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "h-full flex justify-end items-center gap-4 z-10",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-sm",
					children: ["Olá, ", user?.name ?? "Visitante"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 21,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					onClick: handleLogout,
					className: "text-sm text-red-500 hover:text-red-700 font-medium",
					children: "Sair"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 22,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 20,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 16,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "flex",
			style: { height: "calc(100vh - 56px)" },
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("nav", {
				className: "flex bg-erp-nav w-fit hover:w-fit transition-all ease-in-out duration-300 shadow-[0_4px_16px_0px_rgba(0,0,0,0.10)]",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ul", {
					className: "text-white py-4 px-2 space-y-2 min-w-[200px]",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
						to: "/contratos",
						className: "block px-4 py-2 rounded hover:bg-[#009FD0] transition-colors [&.active]:bg-[#E8EEF0] [&.active]:text-erp-nav",
						children: "Contratos"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 33,
						columnNumber: 15
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 32,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 31,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 30,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PageContainer, { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 40,
				columnNumber: 11
			}, this) }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 39,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 27,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 10
	}, this);
}
//#endregion
export { AuthenticatedLayout as component };
