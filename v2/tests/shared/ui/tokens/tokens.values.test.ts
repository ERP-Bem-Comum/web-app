import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// T003 (TDD — vermelho primeiro): valida os VALORES crus de token (fidelidade à v1).
// Importa o módulo PURO de valores (sem vanilla-extract) — runner node:test, import relativo.
import { tokenValues } from '../../../../src/shared/ui/tokens/tokens.values.ts'

// Paleta "institucional" da v1 que NÃO deve ser herdada (FR-009 / SC-005).
const FORBIDDEN_INSTITUTIONAL = ['#396496', '#2d4f75', '#1f7d55', '#176642']

// Coleta recursiva de todos os valores-folha string do objeto de tokens.
function collectLeaves(node: unknown, acc: string[] = []): string[] {
  if (typeof node === 'string') {
    acc.push(node)
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node as Record<string, unknown>)) collectLeaves(v, acc)
  }
  return acc
}

describe('design tokens — valores (fidelidade v1)', () => {
  it('marca: ciano #32C6F4, hover #76D9F8, texto preto sobre marca', () => {
    assert.equal(tokenValues.color.brand.normal, '#32C6F4')
    assert.equal(tokenValues.color.brand.hover, '#76D9F8')
    assert.equal(tokenValues.color.brand.onBrand, '#000000')
  })

  it('superfície: card branco', () => {
    assert.equal(tokenValues.color.surface.default, '#ffffff')
  })

  it('raio base lg = 0.5rem (idêntico à v1)', () => {
    assert.equal(tokenValues.radius.lg, '0.5rem')
  })

  it('NÃO herda a paleta institucional duplicada da v1', () => {
    const leaves = collectLeaves(tokenValues.color).map((s) => s.toLowerCase())
    for (const forbidden of FORBIDDEN_INSTITUTIONAL) {
      assert.equal(
        leaves.includes(forbidden.toLowerCase()),
        false,
        `cor institucional proibida encontrada: ${forbidden}`,
      )
    }
  })

  it('famílias de fonte: heading=Inter, body=Nunito, com fallback de sistema', () => {
    assert.match(tokenValues.font.family.heading, /^['"]?Inter/i)
    assert.match(tokenValues.font.family.body, /^['"]?Nunito/i)
    // fallback de sistema presente nas duas (preserva layout se a webfont não carregar)
    assert.match(tokenValues.font.family.heading, /system-ui|sans-serif/)
    assert.match(tokenValues.font.family.body, /system-ui|sans-serif/)
  })

  it('cobertura: toda folha de token tem valor não-vazio', () => {
    const leaves = collectLeaves(tokenValues)
    assert.ok(leaves.length > 0, 'objeto de tokens vazio')
    for (const value of leaves) {
      assert.notEqual(value.trim(), '', 'token com valor vazio encontrado')
    }
  })

  // T011 (US2 — governança): UMA paleta de marca. O contrato de cor NÃO deve ganhar uma
  // segunda família concorrente (a dívida da v1: institutional azul/verde). Trava por nome.
  it('governança: papéis de cor semânticos, sem segunda paleta concorrente', () => {
    const colorRoles = Object.keys(tokenValues.color)
    const allowedRoles = ['brand', 'surface', 'text', 'border', 'feedback']
    assert.deepEqual(
      [...colorRoles].sort(),
      [...allowedRoles].sort(),
      'color tem papéis inesperados (possível segunda paleta). Esperado: ' + allowedRoles.join(', '),
    )
    // nenhum papel nomeado por cor/contexto cru (ex.: "blue", "green", "institutional")
    const FORBIDDEN_ROLE_NAMES = /blue|green|institutional|cyan|legacy/i
    for (const role of colorRoles) {
      assert.equal(
        FORBIDDEN_ROLE_NAMES.test(role),
        false,
        `papel de cor não-semântico (nomeado por cor/contexto): "${role}"`,
      )
    }
  })
})
