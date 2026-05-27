//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-C8SvqGO7.js
var tsrStartManifest = () => ({
	routes: {
		__root__: {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx",
			children: ["/_authenticated", "/login"],
			preloads: ["/assets/index-ieOPWqPW.js"]
		},
		"/_authenticated": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated.tsx",
			children: [
				"/_authenticated/contratos/adicionar",
				"/_authenticated/contratos/",
				"/_authenticated/contratos/detalhes/$id",
				"/_authenticated/contratos/editar/$id",
				"/_authenticated/contratos/historico/$id"
			],
			preloads: [
				"/assets/_authenticated-BgbEQgYt.js",
				"/assets/useBaseQuery-CUNzJ4Qr.js",
				"/assets/useMutation-DJIf9XFs.js",
				"/assets/useQuery-DJA-dZR7.js",
				"/assets/auth-3euWRt9O.js"
			]
		},
		"/login": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/login.tsx",
			children: void 0,
			preloads: ["/assets/login-Du4Rn-pk.js", "/assets/auth-3euWRt9O.js"]
		},
		"/_authenticated/contratos/adicionar": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/adicionar.tsx",
			children: void 0,
			preloads: ["/assets/adicionar-DzuN8vln.js", "/assets/ContractForm-ClOLyBBI.js"]
		},
		"/_authenticated/contratos/": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx",
			children: void 0,
			preloads: [
				"/assets/contratos-dcKgeka9.js",
				"/assets/useSuspenseQuery-DFulLCnP.js",
				"/assets/queries-D0YZd_1A.js",
				"/assets/contracts-DxpyFB-y.js"
			]
		},
		"/_authenticated/contratos/detalhes/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/detalhes.$id.tsx",
			children: void 0,
			preloads: ["/assets/detalhes._id-Dbq_afwk.js", "/assets/use-contract-C99WYGIN.js"]
		},
		"/_authenticated/contratos/editar/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/editar._id-CbmYp8Us.js",
				"/assets/ContractForm-ClOLyBBI.js",
				"/assets/use-contract-C99WYGIN.js"
			]
		},
		"/_authenticated/contratos/historico/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/historico.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/historico._id-CZQa4v5M.js",
				"/assets/useSuspenseQuery-DFulLCnP.js",
				"/assets/contracts-DxpyFB-y.js"
			]
		}
	},
	clientEntry: "/assets/index-ieOPWqPW.js"
});
//#endregion
export { tsrStartManifest };
