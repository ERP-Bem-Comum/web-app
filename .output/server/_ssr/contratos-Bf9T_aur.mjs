import { c as createFileRoute, s as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as ContractListFiltersSchema } from "./schemas-B7PGPTHM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contratos-Bf9T_aur.js
var $$splitComponentImporter = () => import("./contratos-DxLNQ0pY.mjs");
var Route = createFileRoute("/_authenticated/contratos/")({
	validateSearch: ContractListFiltersSchema,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
