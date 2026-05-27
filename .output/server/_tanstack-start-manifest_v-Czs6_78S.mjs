//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-Czs6_78S.js
var tsrStartManifest = () => ({
	routes: {
		__root__: {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/__root.tsx",
			children: ["/_authenticated", "/login"],
			preloads: ["/assets/index-BVCOj54E.js"]
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
				"/assets/_authenticated-BkOsf5yp.js",
				"/assets/useQuery-C1cDggTH.js",
				"/assets/auth-C-ZMQLaH.js"
			]
		},
		"/login": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/login.tsx",
			children: void 0,
			preloads: ["/assets/login-B-xsDOjX.js", "/assets/auth-C-ZMQLaH.js"]
		},
		"/_authenticated/contratos/adicionar": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/adicionar.tsx",
			children: void 0,
			preloads: ["/assets/adicionar-DAmodh6V.js", "/assets/ContractForm-D82aRtvV.js"]
		},
		"/_authenticated/contratos/": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/index.tsx",
			children: void 0,
			preloads: [
				"/assets/contratos-BdgG-Ouj.js",
				"/assets/useBaseQuery-C3zxHKZz.js",
				"/assets/queries-CMgZM7IH.js",
				"/assets/contracts-BE2Bwq5h.js"
			]
		},
		"/_authenticated/contratos/detalhes/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/detalhes.$id.tsx",
			children: void 0,
			preloads: ["/assets/detalhes._id-BlguGgh8.js", "/assets/use-contract-CBjlRIwI.js"]
		},
		"/_authenticated/contratos/editar/$id": {
			filePath: "/Users/alessandracastro/dev/ERP-FRONTEND/src/routes/_authenticated/contratos/editar.$id.tsx",
			children: void 0,
			preloads: [
				"/assets/editar._id-Bd8dLf2u.js",
				"/assets/ContractForm-D82aRtvV.js",
				"/assets/use-contract-CBjlRIwI.js"
			]
		}
	},
	clientEntry: "/assets/index-BVCOj54E.js"
});
//#endregion
export { tsrStartManifest };
