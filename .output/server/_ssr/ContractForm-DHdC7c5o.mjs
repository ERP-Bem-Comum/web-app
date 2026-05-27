import { i as __toESM } from "../_runtime.mjs";
import { o as require_react, r as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { d as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as createSsrRpc } from "./createSsrRpc-D75-wYbG.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { a as ContractType, i as ContractModel, t as ContractClassification } from "./schemas-B7PGPTHM.mjs";
import { a as updateContract, t as createContract } from "./contracts-BJ_B_piw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ContractForm-DHdC7c5o.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var getSuppliers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("0d9b80a34af217f62297b399d76eb7313d7df3d6925d21bdd62062ad8058708f"));
var getFinanciers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("666756a0e76fe00602f7fa76d7149af817707b657e54b173683e536081ac87ae"));
var getCollaborators = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b6a4cdca5db852fb11e1a1787a8006323156ca732a1c913aff9246492272622e"));
var getBudgetPlans = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("88b31d291b303759492a92f08c8227473d8bce7cd77b41cf5af04c5d3dfc3f47"));
function usePartnerOptions() {
	return {
		suppliers: useQuery({
			queryKey: ["suppliers"],
			queryFn: () => getSuppliers({ data: void 0 })
		}),
		financiers: useQuery({
			queryKey: ["financiers"],
			queryFn: () => getFinanciers({ data: void 0 })
		}),
		collaborators: useQuery({
			queryKey: ["collaborators"],
			queryFn: () => getCollaborators({ data: void 0 })
		}),
		budgetPlans: useQuery({
			queryKey: ["budget-plans"],
			queryFn: () => getBudgetPlans({ data: void 0 })
		})
	};
}
var _jsxFileName = "/Users/alessandracastro/dev/ERP-FRONTEND/src/features/contracts/views/components/ContractForm.tsx";
function ContractForm({ initialData }) {
	const navigate = useNavigate();
	const { suppliers, financiers, collaborators, budgetPlans } = usePartnerOptions();
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const isEdit = !!initialData;
	const [form, setForm] = (0, import_react.useState)({
		classification: initialData?.classification || ContractClassification.CONTRACT,
		contractModel: initialData?.contractModel || ContractModel.SERVICE,
		object: initialData?.object || "",
		totalValue: initialData?.totalValue || 0,
		contractType: initialData?.contractType || ContractType.SUPPLIER,
		contractPeriodStart: initialData?.contractPeriod?.start ? new Date(initialData.contractPeriod.start).toISOString().split("T")[0] : "",
		contractPeriodEnd: initialData?.contractPeriod?.end ? new Date(initialData.contractPeriod.end).toISOString().split("T")[0] : "",
		supplierId: initialData?.supplierId || null,
		financierId: initialData?.financierId || null,
		collaboratorId: initialData?.collaboratorId || null,
		budgetPlanId: initialData?.budgetPlanId || null
	});
	const handleChange = (field, value) => {
		setForm((prev) => ({
			...prev,
			[field]: value
		}));
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const payload = {
				classification: form.classification,
				contractModel: form.contractModel,
				object: form.object,
				totalValue: form.totalValue,
				contractType: form.contractType,
				contractPeriod: {
					start: new Date(form.contractPeriodStart),
					end: new Date(form.contractPeriodEnd)
				},
				supplierId: form.supplierId,
				financierId: form.financierId,
				collaboratorId: form.collaboratorId,
				budgetPlanId: form.budgetPlanId
			};
			if (isEdit) await updateContract({ data: {
				id: initialData.id,
				...payload
			} });
			else await createContract({ data: payload });
			navigate({ to: "/contratos" });
		} catch (err) {
			alert("Erro ao criar contrato: " + (err instanceof Error ? err.message : "unknown"));
		} finally {
			setIsSubmitting(false);
		}
	};
	const partnerOptions = () => {
		switch (form.contractType) {
			case ContractType.SUPPLIER: return suppliers.data?.items || [];
			case ContractType.FINANCIER: return financiers.data?.items || [];
			case ContractType.COLLABORATOR: return collaborators.data?.items || [];
			default: return [];
		}
	};
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
		onSubmit: handleSubmit,
		className: "bg-white rounded-lg shadow p-6 space-y-6 max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
				className: "block text-sm font-medium mb-1",
				children: "Objeto"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 93,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("textarea", {
				className: "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
				rows: 3,
				required: true,
				value: form.object,
				onChange: (e) => handleChange("object", e.target.value)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 94,
				columnNumber: 9
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 92,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Classificação"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 105,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("select", {
					className: "w-full px-3 py-2 border rounded-md",
					value: form.classification,
					onChange: (e) => handleChange("classification", e.target.value),
					children: Object.values(ContractClassification).map((v) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: v,
						children: v
					}, v, false, {
						fileName: _jsxFileName,
						lineNumber: 112,
						columnNumber: 15
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 106,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 104,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Modelo"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 117,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("select", {
					className: "w-full px-3 py-2 border rounded-md",
					value: form.contractModel,
					onChange: (e) => handleChange("contractModel", e.target.value),
					children: Object.values(ContractModel).map((v) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: v,
						children: v
					}, v, false, {
						fileName: _jsxFileName,
						lineNumber: 124,
						columnNumber: 15
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 118,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 116,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 103,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Tipo"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 132,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("select", {
					className: "w-full px-3 py-2 border rounded-md",
					value: form.contractType,
					onChange: (e) => handleChange("contractType", e.target.value),
					children: Object.values(ContractType).map((v) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: v,
						children: v
					}, v, false, {
						fileName: _jsxFileName,
						lineNumber: 139,
						columnNumber: 15
					}, this))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 133,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 131,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Valor Total (R$)"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 144,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
					type: "number",
					min: 0,
					step: .01,
					className: "w-full px-3 py-2 border rounded-md",
					required: true,
					value: form.totalValue,
					onChange: (e) => handleChange("totalValue", parseFloat(e.target.value))
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 145,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 143,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 130,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Início do Período"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 159,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
					type: "date",
					className: "w-full px-3 py-2 border rounded-md",
					required: true,
					value: form.contractPeriodStart,
					onChange: (e) => handleChange("contractPeriodStart", e.target.value)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 160,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 158,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Fim do Período"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 169,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
					type: "date",
					className: "w-full px-3 py-2 border rounded-md",
					required: true,
					value: form.contractPeriodEnd,
					onChange: (e) => handleChange("contractPeriodEnd", e.target.value)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 170,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 168,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 157,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: form.contractType === ContractType.SUPPLIER ? "Fornecedor" : form.contractType === ContractType.FINANCIER ? "Financiador" : form.contractType === ContractType.COLLABORATOR ? "Colaborador" : "Parceiro"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 182,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("select", {
					className: "w-full px-3 py-2 border rounded-md",
					value: (form.supplierId || form.financierId || form.collaboratorId) ?? "",
					onChange: (e) => {
						const val = e.target.value ? Number(e.target.value) : null;
						handleChange("supplierId", form.contractType === ContractType.SUPPLIER ? val : null);
						handleChange("financierId", form.contractType === ContractType.FINANCIER ? val : null);
						handleChange("collaboratorId", form.contractType === ContractType.COLLABORATOR ? val : null);
					},
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: "",
						children: "Selecione..."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 201,
						columnNumber: 13
					}, this), partnerOptions().map((p) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: p.id,
						children: p.name || p.fantasyName || p.corporateName
					}, p.id, false, {
						fileName: _jsxFileName,
						lineNumber: 203,
						columnNumber: 15
					}, this))]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 191,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 181,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("label", {
					className: "block text-sm font-medium mb-1",
					children: "Plano Orçamentário"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 208,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("select", {
					className: "w-full px-3 py-2 border rounded-md",
					value: form.budgetPlanId ?? "",
					onChange: (e) => handleChange("budgetPlanId", e.target.value ? Number(e.target.value) : null),
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: "",
						children: "Selecione..."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 214,
						columnNumber: 13
					}, this), (budgetPlans.data?.items || []).map((bp) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("option", {
						value: bp.id,
						children: [
							bp.scenarioName,
							" (",
							bp.year,
							")"
						]
					}, bp.id, true, {
						fileName: _jsxFileName,
						lineNumber: 216,
						columnNumber: 15
					}, this))]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 209,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 207,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 180,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex justify-end gap-3 pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					onClick: () => navigate({ to: "/contratos" }),
					className: "px-4 py-2 border rounded-md hover:bg-gray-50",
					children: "Cancelar"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 223,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "submit",
					disabled: isSubmitting,
					className: "px-4 py-2 bg-[#32C6F4] hover:bg-[#76D9F8] text-black font-medium rounded-md transition-colors disabled:opacity-50",
					children: isSubmitting ? "Salvando..." : "Salvar"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 230,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 222,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 91,
		columnNumber: 5
	}, this);
}
//#endregion
export { ContractForm as t };
