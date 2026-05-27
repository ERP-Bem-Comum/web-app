import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-BjaVwf5E.js
var authMiddleware = createMiddleware().server(async ({ request, next }) => {
	const sessionToken = (request.headers.get("cookie") || "").split(";").map((c) => c.trim()).find((c) => c.startsWith("session-token="))?.split("=")[1];
	if (!sessionToken) throw new Response("Unauthorized", { status: 401 });
	try {
		const payload = JSON.parse(Buffer.from(sessionToken.split(".")[1], "base64").toString("utf-8"));
		if (payload.exp && payload.exp * 1e3 < Date.now()) throw new Response("Session expired", { status: 401 });
		const user = payload.user;
		if (!user?.token) throw new Response("Invalid session", { status: 401 });
		return next({ context: { session: user } });
	} catch {
		throw new Response("Invalid session", { status: 401 });
	}
});
//#endregion
export { authMiddleware as t };
