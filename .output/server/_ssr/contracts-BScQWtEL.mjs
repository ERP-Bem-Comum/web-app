import { r as createServerFn } from "./ssr.mjs";
import { t as createSsrRpc } from "./createSsrRpc-D75-wYbG.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { c as object, s as number } from "../_libs/zod.mjs";
import { n as ContractCreateInputSchema, r as ContractListFiltersSchema } from "./schemas-B7PGPTHM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contracts-BScQWtEL.js
var getContracts = createServerFn({ method: "GET" }).middleware([authMiddleware]).inputValidator(ContractListFiltersSchema).handler(createSsrRpc("21733bb734508896bbab990a0be92be590eda23a3dc18baa44f8b5be6a987915"));
var GetByIdSchema = object({ id: number() });
var getContractById = createServerFn({ method: "GET" }).middleware([authMiddleware]).inputValidator(GetByIdSchema).handler(createSsrRpc("757f217f9735179dc68295ed6e2e2f300587be0b0c2d6c7e6bbc1c6dbad7d672"));
var createContract = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(ContractCreateInputSchema).handler(createSsrRpc("2c5d88086f299976e460e81001cd34c04430a9183d8dc21948bb4170c781b47b"));
var updateContract = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(ContractCreateInputSchema.extend({ id: number() })).handler(createSsrRpc("fed5490d1d1091454d5fe759b357ccec82911572e748dc87b8cf48551d1c7ad4"));
var deleteContract = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator(object({ id: number() })).handler(createSsrRpc("3842accf9e7e47a59d74742faf0e58ae1b9d1c3aae28536d1c848b9ef60c2cc7"));
//#endregion
export { updateContract as a, getContracts as i, deleteContract as n, getContractById as r, createContract as t };
