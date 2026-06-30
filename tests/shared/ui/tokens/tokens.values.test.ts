import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// T003 (TDD — vermelho primeiro): valida os VALORES crus de token (fidelidade à v1).
// Importa o módulo PURO de valores (sem vanilla-extract) — runner node:test, import relativo.
import { tokenValues } from '../../../../src/shared/ui/tokens/tokens.values.ts'

// Cores da paleta institucional (estética de "documento", usada por contracts/login). Governança:
// são a paleta institucional OFICIAL (papel `color.institutional`), mas NÃO podem vazar para os
// outros papéis semânticos — confinadas ao seu papel, sem virar segunda paleta concorrente difusa.
const INSTITUTIONAL_COLORS = ['#396496', '#2d4f75', '#1f7d55', '#176642']

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
  it('marca: azul sóbrio #2B6CB0 (teste), hover #3F84C6, texto branco sobre marca', () => {
    // TESTE de marca (pendente P.O.) — antes era o ciano v1 #32C6F4. Reverter aqui ao restaurar a marca.
    assert.equal(tokenValues.color.brand.normal, '#2B6CB0')
    assert.equal(tokenValues.color.brand.hover, '#3F84C6')
    assert.equal(tokenValues.color.brand.onBrand, '#FFFFFF')
  })

  it('superfície: card branco', () => {
    assert.equal(tokenValues.color.surface.default, '#ffffff')
  })

  it('raio base lg = 0.5rem (idêntico à v1)', () => {
    assert.equal(tokenValues.radius.lg, '0.5rem')
  })

  it('anel de foco: largura e offset = 2px (acessibilidade, semântico)', () => {
    assert.equal(tokenValues.focusRing.width, '2px')
    assert.equal(tokenValues.focusRing.offset, '2px')
  })

  it('largura de borda: thin = 1px (hairline; token p/ não furar o lint só-tokens)', () => {
    assert.equal(tokenValues.borderWidth.thin, '1px')
  })

  it('cores institucionais ficam confinadas ao papel `institutional` (não vazam p/ outros papéis)', () => {
    const { institutional: _institutional, ...otherRoles } = tokenValues.color
    const leaves = collectLeaves(otherRoles).map((s) => s.toLowerCase())
    for (const c of INSTITUTIONAL_COLORS) {
      assert.equal(
        leaves.includes(c.toLowerCase()),
        false,
        `cor institucional vazou para um papel semântico: ${c}`,
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

  // Governança: a paleta de cor é um CONJUNTO CANÔNICO FECHADO. Papéis oficiais: marca (`brand`),
  // superfícies/texto/borda, `feedback`, `nav` (chrome — sidebar/topbar, índigo #464E78), `status`
  // (semântico), `partnerType` (badges dos 4 tipos de parceiro) e `institutional` (estética de documento).
  // QUALQUER outro papel (nova paleta concorrente) falha o deepEqual. Trava contra papel com nome de cor cru.
  it('governança: papéis de cor = conjunto canônico fechado, sem nova paleta concorrente', () => {
    const colorRoles = Object.keys(tokenValues.color)
    const allowedRoles = ['brand', 'surface', 'text', 'border', 'feedback', 'nav', 'status', 'partnerType', 'institutional']
    assert.deepEqual(
      [...colorRoles].sort(),
      [...allowedRoles].sort(),
      'color tem papéis fora do conjunto canônico (possível nova paleta). Permitido: ' + allowedRoles.join(', '),
    )
    // nenhum papel NOVO nomeado por cor crua (ex.: "blue", "green", "cyan")
    const FORBIDDEN_ROLE_NAMES = /blue|green|cyan|legacy/i
    for (const role of colorRoles) {
      assert.equal(
        FORBIDDEN_ROLE_NAMES.test(role),
        false,
        `papel de cor nomeado por cor crua: "${role}"`,
      )
    }
  })
})
