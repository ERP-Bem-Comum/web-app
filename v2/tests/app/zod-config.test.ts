/**
 * zod-config (node:test) — garante que o boot trava `jitless: true` no Zod global.
 * Regressão: sob CSP estrita (`script-src` sem `'unsafe-eval'`) o probe `new Function` do Zod emite
 * um `securitypolicyviolation`; `jitless` o desliga. Importar o módulo (side-effect) deve setar a flag.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import * as z from 'zod'
import '#app/zod-config.ts'

describe('zod-config (boot)', () => {
  it('seta jitless=true no globalConfig do Zod (sem probe new Function sob CSP)', () => {
    assert.equal(z.config().jitless, true)
  })
})
