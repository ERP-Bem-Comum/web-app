//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-q-Zif3lk.js
var tsrStartManifest = () => ({
	routes: {
		__root__: {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx",
			children: ["/_authenticated", "/login"],
			preloads: ["/assets/index-Dy2igzsP.js"]
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
				"/assets/_authenticated-DSszS7mg.js",
				"/assets/useBaseQuery-CDl06UAY.js",
				"/assets/useMutation-WR-8RDCr.js",
				"/assets/useQuery-s99wqSnU.js",
				"/assets/auth-D8e1xzqO.js"
			]
		},
		"/login": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/login.tsx",
			children: void 0,
			preloads: ["/assets/login-DI8vc2pN.js", "/assets/auth-D8e1xzqO.js"]
		},
		"/_authenticated/contratos/adicionar": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/adicionar.tsx",
			children: void 0,
			preloads: ["/assets/adicionar-CzikvIQs.js", "/assets/ContractForm-ORItVw8b.js"]
		},
		"/_authenticated/contratos/": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx",
			children: void 0,
			preloads: [
				"/assets/contratos-CzgDDn0v.js",
				"/assets/useSuspenseQuery-Ba5FyjNJ.js",
				"/assets/queries-D0YZd_1A.js",
				"/assets/contracts-DcHSrXBf.js"
			]
		},
		"/_authenticated/contratos/detalhes/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/detalhes.$id.tsx",
			children: void 0,
			preloads: ["/assets/detalhes._id-mpyYeG9Q.js", "/assets/use-contract-DLPL-CRj.js"]
		},
		"/_authenticated/contratos/editar/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/editar._id-HPXt8Sv0.js",
				"/assets/ContractForm-ORItVw8b.js",
				"/assets/use-contract-DLPL-CRj.js"
			]
		},
		"/_authenticated/contratos/historico/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/historico.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/historico._id-BVI1_InP.js",
				"/assets/useSuspenseQuery-Ba5FyjNJ.js",
				"/assets/contracts-DcHSrXBf.js"
			]
		}
	},
	clientEntry: "/assets/index-Dy2igzsP.js"
});
//#endregion
export { tsrStartManifest };
