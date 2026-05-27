//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-BK1hyzfr.js
var tsrStartManifest = () => ({
	routes: {
		__root__: {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx",
			children: ["/_authenticated", "/login"],
			preloads: ["/assets/index-BGRzFMux.js"]
		},
		"/_authenticated": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated.tsx",
			children: [
				"/_authenticated/contratos/adicionar",
				"/_authenticated/contratos/",
				"/_authenticated/contratos/detalhes/$id",
				"/_authenticated/contratos/editar/$id"
			],
			preloads: [
				"/assets/_authenticated-DlPHSsHM.js",
				"/assets/useBaseQuery-D_vk3-Uh.js",
				"/assets/useMutation-TqjEYKjo.js",
				"/assets/useQuery-PiEcPSmA.js",
				"/assets/auth-BF2hk-Kq.js"
			]
		},
		"/login": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/login.tsx",
			children: void 0,
			preloads: ["/assets/login-DAO00kqT.js", "/assets/auth-BF2hk-Kq.js"]
		},
		"/_authenticated/contratos/adicionar": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/adicionar.tsx",
			children: void 0,
			preloads: ["/assets/adicionar-DYiI9Zmj.js", "/assets/ContractForm-C0SUJ6JN.js"]
		},
		"/_authenticated/contratos/": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx",
			children: void 0,
			preloads: [
				"/assets/contratos-CfQu0zq8.js",
				"/assets/queries-Bm-68r1S.js",
				"/assets/contracts-DH5hjtrf.js"
			]
		},
		"/_authenticated/contratos/detalhes/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/detalhes.$id.tsx",
			children: void 0,
			preloads: ["/assets/detalhes._id-F09hq8QS.js", "/assets/use-contract-Dh91K82T.js"]
		},
		"/_authenticated/contratos/editar/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/editar._id-C-HIJ_fA.js",
				"/assets/ContractForm-C0SUJ6JN.js",
				"/assets/use-contract-Dh91K82T.js"
			]
		}
	},
	clientEntry: "/assets/index-BGRzFMux.js"
});
//#endregion
export { tsrStartManifest };
