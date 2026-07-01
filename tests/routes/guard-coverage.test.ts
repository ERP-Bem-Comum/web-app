/**
 * Guard coverage (FR-008/FR-010) — invariante de segurança: nenhuma rota de CONTEÚDO pode viver fora de
 * `_authenticated/` sem estar na allowlist pública. Fecha forced-browsing por rota nova sem guard (OWASP cap. 3).
 * Ver `specs/003-auth-security-hardening/contracts/guard-coverage.md`.
 *
 * Mecânica: varre `src/routes/` e falha se um arquivo de rota de conteúdo não estiver sob `_authenticated/`
 * nem na allowlist. Adicionar rota pública = editar a allowlist conscientemente (o teste força a decisão).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const routesDir = join(here, '..', '..', 'src', 'routes')

/** Rotas públicas permitidas FORA de `_authenticated/`. Mudou? Edite aqui conscientemente. */
const PUBLIC_ROUTES: readonly string[] = [
  'index.tsx',
  'login.tsx',
  'health.tsx',
  // Fluxo "Esqueci Minha Senha" (#037): rota pública por construção (usuário deslogado). Sem sessão;
  // beforeLoad redireciona ao dashboard se já autenticado. Anti-enumeração garantida no BFF.
  'recuperar-senha.tsx',
  // Fluxo "Redefinir Senha" (#038): rota pública por construção — o usuário chega deslogado pelo link
  // do e-mail (?token=...). Sem sessão; beforeLoad redireciona ao dashboard se já autenticado. O token
  // só cruza a fronteira via a server fn (Zod + CSRF-origin); nada de sessão no browser.
  'reset-password.tsx',
  // Fluxo "Ativação de Conta" (#039): rota pública por construção — o convidado chega deslogado pelo
  // link do e-mail de convite (?token=...). Mesma tela do reset (variant='activate'), mesmo server fn.
  // Sem sessão; beforeLoad redireciona ao dashboard se já autenticado.
  'activate.tsx',
]

/** Infra do router (não são rotas de conteúdo). */
const ROUTER_INFRA: readonly string[] = ['__root.tsx']

describe('guard coverage — nenhuma rota de conteúdo órfã (FR-008/FR-010)', () => {
  it('toda rota de conteúdo no topo de src/routes/ está na allowlist pública ou em _authenticated/', () => {
    const topLevel = readdirSync(routesDir, { withFileTypes: true })

    const contentRoutesAtTop = topLevel
      .filter((e) => e.isFile() && e.name.endsWith('.tsx'))
      .map((e) => e.name)
      .filter((name) => !ROUTER_INFRA.includes(name))

    const orphans = contentRoutesAtTop.filter((name) => !PUBLIC_ROUTES.includes(name))

    assert.deepEqual(
      orphans,
      [],
      `Rotas de conteúdo fora de _authenticated/ e fora da allowlist pública: ${orphans.join(', ')}. ` +
        `Mova para src/routes/_authenticated/ OU, se for realmente pública, adicione à allowlist PUBLIC_ROUTES.`,
    )
  })

  it('o layout protegido _authenticated/ existe (parent guard presente)', () => {
    const entries = readdirSync(routesDir, { withFileTypes: true })
    const hasAuthLayout = entries.some((e) => e.isDirectory() && e.name === '_authenticated')
    assert.equal(hasAuthLayout, true, 'src/routes/_authenticated/ deve existir como layout guard')
  })
})
