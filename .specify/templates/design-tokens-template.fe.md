# 01 · Design Tokens: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Base**: ADR-0007 (vanilla-extract, zero-runtime), `shared/ui/tokens`

> A camada base do Atomic Design. **Regra constitucional**: `ui/` (atoms/molecules/organisms e
> `modules/*/client/ui`) **não** usa hex/rgb/hsl/px crus — só `vars.*` de `#shared/ui/tokens`. A fonte de
> verdade dos literais vive em `tokens/` e `*.values.ts`. Este doc mapeia os tokens que a feature usa e
> sinaliza **lacunas** (token novo necessário) — não inventa cor solta na tela.

## 1. Tokens existentes reutilizados

| Token (`vars.*`) | Valor | Uso na feature |
|---|---|---|
| `vars.color.brand.primary` | [#…] | [sidebar/header] |
| `vars.color.accent` | [#…] | [CTA/realce] |
| `vars.space.*` · `vars.radius.*` · `vars.font.*` | [...] | [...] |

## 2. Tokens novos propostos (se houver)

> Cada novo token exige adição em `*.values.ts` + justificativa. Evite — prefira reusar.

| Token proposto | Valor | Por que não dá pra reusar um existente |
|---|---|---|
| [...] | [...] | [...] |

## 3. Mapa semântico (observado na evidência → token)

| Papel visual (evidência) | Cor/medida crua observada | Token canônico |
|---|---|---|
| [Status Ativo] | [borda verde] | [`vars.color.status.active`] |
| [Alerta sem contrato] | [salmão] | [`vars.color.status.warning`] |

## 4. Lacunas / riscos

- [Cores observadas sem token correspondente; decisão.]
