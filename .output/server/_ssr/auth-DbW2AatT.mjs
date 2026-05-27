import { r as createServerFn } from "./ssr.mjs";
import { t as createSsrRpc } from "./createSsrRpc-D75-wYbG.mjs";
import { t as authMiddleware } from "./auth-BjaVwf5E.mjs";
import { c as object, l as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DbW2AatT.js
var loginInputSchema = object({
	email: string().email(),
	password: string().min(1)
});
var login = createServerFn({ method: "POST" }).inputValidator(loginInputSchema).handler(createSsrRpc("b9add455e4a20c5a8ce7d0fa177795c1edc5cadeccb49800474436b88cd2a97c"));
createServerFn({ method: "POST" }).handler(createSsrRpc("58d482668ee4f1bd4655ddc09985d343aa3f4b6ab65073bd9357cdaf12c68656"));
var getSession = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("a25ee52c3707674a0708759ce51bbede27783305d5c10599240f3902a9f63a55"));
//#endregion
export { login as n, getSession as t };
