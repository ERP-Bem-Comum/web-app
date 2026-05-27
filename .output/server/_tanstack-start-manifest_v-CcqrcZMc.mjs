//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-CcqrcZMc.js
var tsrStartManifest = () => ({
	routes: {
		__root__: {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx",
			children: ["/_authenticated", "/login"],
			preloads: ["/assets/index-Cd3aW-Mf.js"]
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
				"/assets/_authenticated-C97ClMNV.js",
				"/assets/useBaseQuery-ClDbtilY.js",
				"/assets/useMutation-eHweuw8F.js",
				"/assets/useQuery-CAjz0fXK.js",
				"/assets/auth-BSnfstZi.js"
			]
		},
		"/login": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/login.tsx",
			children: void 0,
			preloads: ["/assets/login-BxDS-1S-.js", "/assets/auth-BSnfstZi.js"]
		},
		"/_authenticated/contratos/adicionar": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/adicionar.tsx",
			children: void 0,
			preloads: ["/assets/adicionar-BXEEXeus.js", "/assets/ContractForm-nDK4PXQe.js"]
		},
		"/_authenticated/contratos/": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx",
			children: void 0,
			preloads: [
				"/assets/contratos-Cdk6JE5X.js",
				"/assets/useSuspenseQuery-Bjp67SuU.js",
				"/assets/queries-D0YZd_1A.js",
				"/assets/contracts-DRjCfA7s.js"
			]
		},
		"/_authenticated/contratos/detalhes/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/detalhes.$id.tsx",
			children: void 0,
			preloads: ["/assets/detalhes._id-Bvn49jeV.js", "/assets/use-contract-C3Q8b8oZ.js"]
		},
		"/_authenticated/contratos/editar/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/editar._id-CusdRb81.js",
				"/assets/ContractForm-nDK4PXQe.js",
				"/assets/use-contract-C3Q8b8oZ.js"
			]
		},
		"/_authenticated/contratos/historico/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/historico.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/historico._id-B46WPc1Z.js",
				"/assets/useSuspenseQuery-Bjp67SuU.js",
				"/assets/contracts-DRjCfA7s.js"
			]
		}
	},
	clientEntry: "/assets/index-Cd3aW-Mf.js"
});
//#endregion
export { tsrStartManifest };
