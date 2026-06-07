/**
 * Governança (ADR-0010): a fronteira RPC declara a intenção no nome — `*.query.fn.ts` (leitura) ou
 * `*.service.fn.ts` (escrita/comando). O sufixo legado `*.server-fn.ts` só é tolerado em `auth/` (a
 * feature-modelo, que migra em follow-up).
 *
 * Mecânica: varre os adapters de cada módulo (server-fns) e falha se um arquivo de server fn não usar o
 * sufixo novo (fora do allowlist `auth`). Criou uma fn nova? Nomeie `.query.fn.ts`/`.service.fn.ts`.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const modulesDir = join(here, '..', '..', 'src', 'modules')

/** Módulos que ainda podem usar o sufixo legado `.server-fn.ts`. Migrou? Remova daqui. */
const LEGACY_SERVER_FN_ALLOWLIST: readonly string[] = ['auth']

const allFiles = readdirSync(modulesDir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.ts'))
  .map((e) => join(e.parentPath, e.name).slice(modulesDir.length + 1).replaceAll('\\', '/'))

// Arquivos de fronteira RPC: vivem em adapters/server-fns/ (qualquer profundidade).
const fnFiles = allFiles.filter((p) => p.includes('/server/adapters/server-fns/'))

const moduleOf = (p: string): string => p.split('/')[0] ?? ''
const isNewSuffix = (p: string): boolean => p.endsWith('.query.fn.ts') || p.endsWith('.service.fn.ts')
const isLegacySuffix = (p: string): boolean => p.endsWith('.server-fn.ts')

describe('arquitetura — nomenclatura das server fns (ADR-0010)', () => {
  it('toda server fn usa .query.fn.ts ou .service.fn.ts (auth ainda pode .server-fn.ts)', () => {
    const offenders = fnFiles.filter((p) => {
      if (isNewSuffix(p)) return false
      if (isLegacySuffix(p) && LEGACY_SERVER_FN_ALLOWLIST.includes(moduleOf(p))) return false
      return true
    })

    assert.deepEqual(
      offenders,
      [],
      `Server fn com nome fora do padrão (ADR-0010): ${offenders.join(', ')}. ` +
        `Use .query.fn.ts (leitura) ou .service.fn.ts (escrita). Legado .server-fn.ts só em: ${LEGACY_SERVER_FN_ALLOWLIST.join(', ')}.`,
    )
  })

  it('há pelo menos uma server fn no padrão novo (sanidade do scanner)', () => {
    assert.ok(fnFiles.some(isNewSuffix), 'scanner não achou nenhuma .query.fn/.service.fn — caminho errado?')
  })
})
