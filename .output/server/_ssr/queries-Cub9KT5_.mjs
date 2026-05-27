//#region node_modules/.nitro/vite/services/ssr/assets/queries-Cub9KT5_.js
var contractKeys = {
	all: ["contracts"],
	lists: () => [...contractKeys.all, "list"],
	list: (filters) => [...contractKeys.lists(), filters],
	details: () => [...contractKeys.all, "detail"],
	detail: (id) => [...contractKeys.details(), id]
};
//#endregion
export { contractKeys as t };
