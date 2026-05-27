import { n as useSuspenseQuery } from "../_libs/react+tanstack__react-query.mjs";
import { r as getContractById } from "./contracts-BScQWtEL.mjs";
import { t as contractKeys } from "./queries-Cub9KT5_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-contract-B-Vr_aP1.js
function useContract(id) {
	return useSuspenseQuery({
		queryKey: contractKeys.detail(id),
		queryFn: () => getContractById({ data: { id } })
	});
}
//#endregion
export { useContract as t };
