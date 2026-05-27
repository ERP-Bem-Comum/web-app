import { n as useSuspenseQuery } from "../_libs/react+tanstack__react-query.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { i as getContractHistory } from "./contracts-lZWzj6uY.mjs";
import { t as Route } from "./historico._id-BiWvSgQe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/historico._id-CZesqARv.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
function useContractHistory(id) {
	return useSuspenseQuery({
		queryKey: [
			"contracts",
			"history",
			id
		],
		queryFn: () => getContractHistory({ data: { id } })
	});
}
var _jsxFileName = "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/historico.$id.tsx?tsr-split=component";
function ContractHistoryPage() {
	const { id } = Route.useParams();
	const { data: history } = useContractHistory(Number(id));
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
				className: "text-2xl font-bold",
				children: "Histórico do Contrato"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 12,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "mt-4 text-gray-600",
				children: ["ID: ", id]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 13,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("pre", {
				className: "mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto",
				children: JSON.stringify(history, null, 2)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 14,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 11,
		columnNumber: 10
	}, this);
}
//#endregion
export { ContractHistoryPage as component };
