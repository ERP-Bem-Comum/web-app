import { i as __toESM } from "../_runtime.mjs";
import { i as useQueryClient, n as useSuspenseQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { u as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { a as getContracts, n as deleteContract } from "./contracts-lZWzj6uY.mjs";
import { t as Route } from "./contratos-BiehLyWQ.mjs";
import { t as contractKeys } from "./queries-Cub9KT5_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contratos-BqX3q60-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
function useContracts(filters) {
	return useSuspenseQuery({
		queryKey: contractKeys.list(filters),
		queryFn: () => getContracts({ data: filters })
	});
}
var _jsxFileName$1 = "/Users/alessandracastro/dev/ERP-FRONTEND/src/features/contracts/views/components/ContractsTable.tsx";
function ContractsTable({ rows }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "w-full overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("table", {
			className: "w-full text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("thead", {
				className: "bg-gray-100 text-gray-700 uppercase",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Código"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 17,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Objeto"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 18,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Tipo"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 19,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Status"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 20,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Valor"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 21,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Período"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 22,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Fornecedor"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 23,
						columnNumber: 13
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("th", {
						className: "px-4 py-3 text-left",
						children: "Ações"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 24,
						columnNumber: 13
					}, this)
				] }, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 16,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 15,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tbody", { children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("tr", {
				className: "border-b hover:bg-gray-50",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3 font-medium",
						children: row.contractCode
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 30,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3 max-w-[200px] truncate",
						children: row.object
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 31,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3",
						children: row.contractType
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 32,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(StatusBadge, { status: row.contractStatus }, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 34,
							columnNumber: 17
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 33,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3",
						children: row.totalValue?.toLocaleString("pt-BR", {
							style: "currency",
							currency: "BRL"
						})
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 36,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3 whitespace-nowrap",
						children: [
							row.contractPeriod?.start ? new Date(row.contractPeriod.start).toLocaleDateString("pt-BR") : "-",
							" → ",
							row.contractPeriod?.end ? new Date(row.contractPeriod.end).toLocaleDateString("pt-BR") : "-"
						]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 42,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3",
						children: row.supplier?.name || "-"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 51,
						columnNumber: 15
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("td", {
						className: "px-4 py-3",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
									to: "/contratos/detalhes/$id",
									params: { id: String(row.id) },
									className: "text-blue-600 hover:text-blue-800 font-medium",
									children: "Ver"
								}, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 54,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
									to: "/contratos/editar/$id",
									params: { id: String(row.id) },
									className: "text-green-600 hover:text-green-800 font-medium",
									children: "Editar"
								}, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 61,
									columnNumber: 19
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(DeleteButton, { id: row.id }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 68,
									columnNumber: 19
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 53,
							columnNumber: 17
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 52,
						columnNumber: 15
					}, this)
				]
			}, row.id, true, {
				fileName: _jsxFileName$1,
				lineNumber: 29,
				columnNumber: 13
			}, this)) }, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 27,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$1,
			lineNumber: 14,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 13,
		columnNumber: 5
	}, this);
}
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
		className: `px-2 py-1 rounded-full text-xs font-medium ${{
			Pendente: "bg-yellow-100 text-yellow-800",
			Assinado: "bg-blue-100 text-blue-800",
			"Em andamento": "bg-green-100 text-green-800",
			Finalizado: "bg-gray-100 text-gray-800",
			Distrato: "bg-red-100 text-red-800"
		}[status] || "bg-gray-100"}`,
		children: status
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 89,
		columnNumber: 5
	}, this);
}
function DeleteButton({ id }) {
	const qc = useQueryClient();
	const mutation = useMutation({
		mutationFn: () => deleteContract({ data: { id } }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: contractKeys.lists() });
		}
	});
	const handleClick = () => {
		if (confirm("Tem certeza que deseja excluir este contrato?")) mutation.mutate();
	};
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
		onClick: handleClick,
		disabled: mutation.isPending,
		className: "text-red-600 hover:text-red-800 font-medium disabled:opacity-50",
		children: mutation.isPending ? "Excluindo..." : "Excluir"
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 111,
		columnNumber: 5
	}, this);
}
var _jsxFileName = "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx?tsr-split=component";
function ContractsPage() {
	const { data } = useContracts(Route.useSearch());
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "p-6",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "flex justify-between items-center mb-6",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
				className: "text-2xl font-bold",
				children: "Contratos"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 12,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
				href: "/contratos/adicionar",
				className: "bg-[#32C6F4] hover:bg-[#76D9F8] text-black font-medium py-2 px-4 rounded-md transition-colors",
				children: "+ Novo Contrato"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 13,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 11,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "p-4 text-gray-500",
				children: "Carregando contratos..."
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 18,
				columnNumber: 27
			}, this),
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ContractsTable, { rows: data?.items || [] }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 19,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 18,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 10,
		columnNumber: 10
	}, this);
}
//#endregion
export { ContractsPage as component };
