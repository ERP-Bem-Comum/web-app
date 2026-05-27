import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { c as object, l as string } from "../_libs/zod.mjs";
import { n as env, r as resultFetch, t as createServerRpc } from "./result-fetch-eo8vxO5I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-C4c1n9kK.js
var loginInputSchema = object({
	email: string().email(),
	password: string().min(1)
});
var login_createServerFn_handler = createServerRpc({
	id: "b9add455e4a20c5a8ce7d0fa177795c1edc5cadeccb49800474436b88cd2a97c",
	name: "login",
	filename: "src/server/auth.ts"
}, (opts) => login.__executeServer(opts));
var login = createServerFn({ method: "POST" }).inputValidator(loginInputSchema).handler(login_createServerFn_handler, async ({ data }) => {
	const res = await resultFetch(`${env.API_URL}/auth/login`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(data)
	});
	if (!res.ok) {
		if (res.error.kind === "http") throw new Response(JSON.stringify(res.error.body), { status: res.error.status });
		throw new Response("Login failed", { status: 500 });
	}
	const responseData = await res.value.json();
	const user = responseData.user;
	const token = responseData.token;
	if (!user || !token) throw new Response("Invalid credentials", { status: 401 });
	const sessionToken = `${Buffer.from(JSON.stringify({
		alg: "none",
		typ: "JWT"
	})).toString("base64url")}.${Buffer.from(JSON.stringify({
		user: {
			userId: user.id,
			email: user.email,
			name: user.name,
			token
		},
		exp: Math.floor(Date.now() / 1e3) + 480 * 60
	})).toString("base64url")}.`;
	return new Response(JSON.stringify({ user: {
		id: user.id,
		email: user.email,
		name: user.name
	} }), {
		status: 200,
		headers: {
			"content-type": "application/json",
			"set-cookie": `session-token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${480 * 60}`
		}
	});
});
var logout_createServerFn_handler = createServerRpc({
	id: "58d482668ee4f1bd4655ddc09985d343aa3f4b6ab65073bd9357cdaf12c68656",
	name: "logout",
	filename: "src/server/auth.ts"
}, (opts) => logout.__executeServer(opts));
var logout = createServerFn({ method: "POST" }).handler(logout_createServerFn_handler, async () => {
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: {
			"content-type": "application/json",
			"set-cookie": `session-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
		}
	});
});
var getSession_createServerFn_handler = createServerRpc({
	id: "a25ee52c3707674a0708759ce51bbede27783305d5c10599240f3902a9f63a55",
	name: "getSession",
	filename: "src/server/auth.ts"
}, (opts) => getSession.__executeServer(opts));
var getSession = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSession_createServerFn_handler, async ({ context }) => {
	return { user: {
		id: context.session.userId,
		email: context.session.email,
		name: context.session.name
	} };
});
//#endregion
export { getSession_createServerFn_handler, login_createServerFn_handler, logout_createServerFn_handler };
