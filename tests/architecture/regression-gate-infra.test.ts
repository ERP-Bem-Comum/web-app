/**
 * REGRESSÃO — gate de qualidade / infra (TICKET-002).
 *
 * ⚠️ FALHA DE PROPÓSITO até o gate ser montado (G1–G3). Vira verde ao concluir. Ticket:
 * handbook/reviews/TICKET-002-gate-infra-qualidade.md
 *
 * Garante que o gate (Prettier + husky/lint-staged + CI em PR) exista e NÃO seja removido sem aviso.
 * Governança por leitura de arquivos — não importa módulos.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')
const exists = (rel: string): boolean => existsSync(join(root, rel))

interface PkgJson {
  readonly devDependencies?: Readonly<Record<string, string>>
  readonly scripts?: Readonly<Record<string, string>>
  readonly 'lint-staged'?: unknown
}
const pkg = (): PkgJson => JSON.parse(read('package.json')) as PkgJson

// ─── G1 — Prettier ───────────────────────────────────────────────────────────
describe('G1 — Prettier instalado e configurado', () => {
  it('g1-prettier-devdep: prettier e eslint-config-prettier em devDependencies', () => {
    const dev = pkg().devDependencies ?? {}
    assert.ok('prettier' in dev, 'Adicione `prettier` (-D) — ver G1.')
    assert.ok('eslint-config-prettier' in dev, 'Adicione `eslint-config-prettier` (-D) — ver G1.')
  })
  it('g1-prettier-config: existe .prettierrc(.json) e .prettierignore', () => {
    assert.ok(
      exists('.prettierrc.json') || exists('.prettierrc') || exists('prettier.config.js'),
      'Crie o arquivo de config do Prettier — ver G1.',
    )
    assert.ok(exists('.prettierignore'), 'Crie .prettierignore — ver G1.')
  })
  it('g1-scripts: package.json tem scripts format e format:check', () => {
    const s = pkg().scripts ?? {}
    assert.ok('format' in s && 'format:check' in s, 'Adicione os scripts format/format:check — ver G1.')
  })
})

// ─── G2 — husky + lint-staged ─────────────────────────────────────────────────
describe('G2 — git hook local (husky + lint-staged)', () => {
  it('g2-devdeps: husky e lint-staged em devDependencies', () => {
    const dev = pkg().devDependencies ?? {}
    assert.ok('husky' in dev, 'Adicione `husky` (-D) — ver G2.')
    assert.ok('lint-staged' in dev, 'Adicione `lint-staged` (-D) — ver G2.')
  })
  it('g2-lint-staged-config: package.json tem o bloco lint-staged', () => {
    assert.notEqual(pkg()['lint-staged'], undefined, 'Configure o bloco `lint-staged` no package.json — ver G2.')
  })
  it('g2-hooks: existem .husky/pre-commit e .husky/pre-push', () => {
    assert.ok(exists('.husky/pre-commit'), 'Crie .husky/pre-commit (lint-staged) — ver G2.')
    assert.ok(exists('.husky/pre-push'), 'Crie .husky/pre-push (pnpm verify) — ver G2.')
  })
})

// ─── G3 — CI em PR ─────────────────────────────────────────────────────────────
describe('G3 — CI em pull_request rodando verify', () => {
  it('g3-workflow-existe: .github/workflows/ci.yml existe', () => {
    assert.ok(exists('.github/workflows/ci.yml'), 'Crie o workflow de CI de PR — ver G3.')
  })
  it('g3-workflow-roda-gates: o workflow dispara em pull_request e roda lint+typecheck+test', () => {
    const yml = exists('.github/workflows/ci.yml') ? read('.github/workflows/ci.yml') : ''
    assert.match(yml, /pull_request/, 'O CI deve disparar em pull_request — ver G3.')
    assert.match(yml, /pnpm (typecheck|verify)/, 'O CI deve rodar typecheck/verify — ver G3.')
    assert.match(yml, /pnpm lint/, 'O CI deve rodar lint — ver G3.')
    assert.match(yml, /pnpm test/, 'O CI deve rodar os testes — ver G3.')
  })
})
