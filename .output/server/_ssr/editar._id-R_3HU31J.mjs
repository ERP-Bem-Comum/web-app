import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as ContractForm } from "./ContractForm-DHdC7c5o.mjs";
import { t as useContract } from "./use-contract-C1AYeEKd.mjs";
import { t as Route } from "./editar._id-BmuOPjng.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/editar._id-R_3HU31J.js
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx?tsr-split=component";
function EditContractPage() {
	const { id } = Route.useParams();
	const { data: contract, isLoading } = useContract(Number(id));
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "p-6",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "animate-pulse space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "h-8 bg-gray-200 rounded w-1/3" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 16,
				columnNumber: 11
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "h-64 bg-gray-200 rounded" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 17,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 15,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 14,
		columnNumber: 12
	}, this);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "p-6",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
			className: "text-2xl font-bold mb-6",
			children: "Editar Contrato"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 22,
			columnNumber: 7
		}, this), contract ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ContractForm, { initialData: contract }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 23,
			columnNumber: 19
		}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
			className: "text-gray-500",
			children: "Contrato não encontrado."
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 23,
			columnNumber: 61
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 21,
		columnNumber: 10
	}, this);
}
//#endregion
export { EditContractPage as component };
