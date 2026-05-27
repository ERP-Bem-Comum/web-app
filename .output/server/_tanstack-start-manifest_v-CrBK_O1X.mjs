//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-CrBK_O1X.js
var tsrStartManifest = () => ({
	routes: {
		__root__: {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx",
			children: ["/_authenticated", "/login"],
			preloads: ["/assets/index-sAbyAes3.js"]
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
				"/assets/_authenticated-BOcIdqzg.js",
				"/assets/useBaseQuery-BC1Kn4CU.js",
				"/assets/useMutation-3qQgEvQw.js",
				"/assets/useQuery-C3YZJHwc.js",
				"/assets/auth-CRWeX0i5.js"
			]
		},
		"/login": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/login.tsx",
			children: void 0,
			preloads: ["/assets/login-D7HQFMb2.js", "/assets/auth-CRWeX0i5.js"]
		},
		"/_authenticated/contratos/adicionar": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/adicionar.tsx",
			children: void 0,
			preloads: ["/assets/adicionar-BzeIcZG1.js", "/assets/ContractForm-BsZNvzNy.js"]
		},
		"/_authenticated/contratos/": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx",
			children: void 0,
			preloads: [
				"/assets/contratos-BztZnKIn.js",
				"/assets/useSuspenseQuery-CY8fdmHZ.js",
				"/assets/queries-D0YZd_1A.js",
				"/assets/contracts-D0o7_Klw.js"
			]
		},
		"/_authenticated/contratos/detalhes/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/detalhes.$id.tsx",
			children: void 0,
			preloads: ["/assets/detalhes._id-DTZocBnn.js", "/assets/use-contract-D4yYi67Y.js"]
		},
		"/_authenticated/contratos/editar/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/editar._id-Yji4yDls.js",
				"/assets/ContractForm-BsZNvzNy.js",
				"/assets/use-contract-D4yYi67Y.js"
			]
		},
		"/_authenticated/contratos/historico/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/historico.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/historico._id-yqgUsKfu.js",
				"/assets/useSuspenseQuery-CY8fdmHZ.js",
				"/assets/contracts-D0o7_Klw.js"
			]
		}
	},
	clientEntry: "/assets/index-sAbyAes3.js"
});
//#endregion
export { tsrStartManifest };
