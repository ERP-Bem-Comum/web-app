/**
 * Zod — config global (side-effect, 1× no boot): `jitless: true`.
 *
 * O Zod 4 faz um probe `new Function("")` na 1ª validação (feature-detection do validador JIT).
 * Nossa CSP (`script-src` sem `'unsafe-eval'`, por design — ADR-0006) bloqueia o eval: o Zod ENGOLE
 * o throw e cai no caminho interpretado (validação intacta), mas o browser ainda emite um
 * `securitypolicyviolation` no console — e o mesmo report dispararia em produção (CSP idêntica).
 *
 * `jitless: true` é o escape hatch oficial do Zod p/ CSP estrita (ver comentário em
 * `zod/v4/core/util.js` no `allowsEval`): pula o probe e o JIT de vez. Custo: validação um pouco
 * mais lenta (interpretado), desprezível p/ os payloads de borda daqui (form de login, responses do
 * core-api). Importado como side-effect no bootstrap → roda no SSR e no client antes de qualquer parse.
 */
import * as z from 'zod'

z.config({ jitless: true })
