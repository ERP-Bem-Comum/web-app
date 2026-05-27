import { a as date, c as object, i as array, l as string, n as _enum, o as nativeEnum, r as any, s as number$1, t as number } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schemas-B7PGPTHM.js
var ContractClassification = /* @__PURE__ */ function(ContractClassification) {
	ContractClassification["CONTRACT"] = "Contrato";
	ContractClassification["SERVICE_ORDER"] = "Ordem de Serviço";
	return ContractClassification;
}({});
var ContractType = /* @__PURE__ */ function(ContractType) {
	ContractType["SUPPLIER"] = "Fornecedor";
	ContractType["FINANCIER"] = "Financiador";
	ContractType["COLLABORATOR"] = "Colaborador";
	ContractType["ACT"] = "ACT";
	return ContractType;
}({});
var ContractModel = /* @__PURE__ */ function(ContractModel) {
	ContractModel["SERVICE"] = "Serviço";
	ContractModel["DONATION"] = "Doação";
	return ContractModel;
}({});
var ContractStatus = /* @__PURE__ */ function(ContractStatus) {
	ContractStatus["PENDING"] = "Pendente";
	ContractStatus["SIGNED"] = "Assinado";
	ContractStatus["ONGOING"] = "Em andamento";
	ContractStatus["FINISHED"] = "Finalizado";
	ContractStatus["DISTRATO"] = "Distrato";
	return ContractStatus;
}({});
var ContractListFiltersSchema = object({
	page: number().int().min(1).default(1),
	limit: number().int().min(1).max(100).default(10),
	search: string().optional(),
	budgetPlanId: number$1().nullish(),
	contractPeriodStart: string().date().optional(),
	contractPeriodEnd: string().date().optional(),
	contractType: nativeEnum(ContractType).optional(),
	contractStatus: nativeEnum(ContractStatus).optional(),
	order: _enum(["ASC", "DESC"]).default("DESC")
});
var ContractCreateInputSchema = object({
	classification: nativeEnum(ContractClassification),
	contractModel: nativeEnum(ContractModel),
	object: string().min(1, "Objeto é obrigatório"),
	totalValue: number$1().min(0),
	contractPeriod: object({
		start: date(),
		end: date()
	}),
	contractType: nativeEnum(ContractType),
	supplierId: number$1().nullish(),
	financierId: number$1().nullish(),
	collaboratorId: number$1().nullish(),
	budgetPlanId: number$1().nullish(),
	programId: number$1().nullish(),
	supplier: any().nullish(),
	financier: any().nullish(),
	collaborator: any().nullish(),
	parentId: number$1().nullish(),
	contractStatus: nativeEnum(ContractStatus).optional(),
	dataAssinatura: string().nullish(),
	signedContractUrl: string().nullish(),
	observations: string().nullish(),
	categorizacao: array(string()).nullish(),
	centroDeCusto: array(string()).nullish()
});
//#endregion
export { ContractType as a, ContractModel as i, ContractCreateInputSchema as n, ContractListFiltersSchema as r, ContractClassification as t };
