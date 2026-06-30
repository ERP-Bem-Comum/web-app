# ADR-0008 — Self-host de webfonts via @fontsource

**Status:** Accepted
**Data:** 2026-05-30
**Decisores:** Gabriel (Tech Lead)
**Contexto da spec:** `specs/004-design-tokens/`

---

## Contexto

A identidade tipográfica da v1 usa **Inter** (títulos/labels), **Nunito** (corpo) e **JetBrains Mono**
(código), carregadas via **CDN Google Fonts** (`<link>` para `fonts.googleapis.com`). A v2 precisa das
mesmas famílias (fidelidade visual), mas a constituição exige: BFF-boundary (§I — "browser só fala com o
BFF"), dependências mínimas (§VIII) e há requisitos de privacidade/LGPD. Carregar fonte de CDN externo
envia o IP do usuário a terceiros e complica a CSP do hardening de auth (spec 003).

## Decisão

**Self-host das webfonts via `@fontsource`**, instalado por npm e versionado pelo lockfile:

- `@fontsource-variable/inter` (variable font — toda a faixa de peso num arquivo)
- `@fontsource-variable/nunito` (variable font)
- `@fontsource/jetbrains-mono` (pesos 400/500)

Os `@font-face` (self-host) são importados uma vez no boot (`src/app/router.tsx`); os tokens
`font.family.*` referenciam as famílias com fallback de sistema. Nenhuma chamada a domínio externo.

### Evidência de risco (investigação 2026-05-30)

Os 3 pacotes foram inspecionados isoladamente:

| Critério | Resultado |
|----------|-----------|
| Scripts (postinstall/install) | **NENHUM** |
| Dependências transitivas | **ZERO** (cada um) |
| JS executável (`.js/.mjs/.cjs`) | **ZERO** — só `.woff2` + `.css` |
| Pacotes adicionados ao `.pnpm` | exatamente **3** (sem cauda) |
| Provenance (attestation) | **Presente** nos 3 → passa `trustPolicy: no-downgrade` |
| Idade de publicação | set/2025 → passa `minimumReleaseAge: 1440` |

Conclusão: são **assets tipográficos empacotados**, não código. A superfície de execução que o Princípio
§VIII visa conter **não existe** aqui — esta decisão **serve** ao §VIII melhor que a alternativa manual.

## Consequências

**Positivas:**
- Privacidade/LGPD: zero IP do usuário a terceiros; nada de `fonts.gstatic.com`.
- Sem FOUC, funciona offline e no Docker; alinhado ao BFF-boundary (§I).
- Versionado + provenance + atualização via lockfile (auditável, reproduzível).
- Não afeta a CSP (sem origem externa de fonte).

**Negativas / trade-offs:**
- +3 entradas no `package.json` e os `.woff2` entram no bundle/output (peso de assets — esperado para
  self-host).
- Atualização de fonte = bump de versão (passa pela quarentena de 1 dia do ADR-0003 — aceitável).

## Alternativas consideradas

- **CDN Google Fonts (como a v1):** rejeitado — vaza IP do usuário (LGPD), depende de domínio externo,
  risco de FOUC/offline, complica a CSP do hardening de auth.
- **Baixar `.woff2` manualmente p/ `public/fonts/`:** rejeitado — zero deps ao pé da letra, mas sem
  versionamento/provenance, integridade e atualização manuais, fácil divergir. `@fontsource` entrega o
  mesmo self-host com governança superior e risco de execução igualmente nulo.
- **Fontes de sistema (sem webfont):** rejeitado — zero custo, mas quebra a fidelidade visual à v1
  (contraria o objetivo de migração imperceptível).

---

## Referências

- Constituição §I (BFF-Orchestrated Boundary), §VIII (Minimal Dependencies), §IX (pnpm + supply-chain)
- ADR-0003 (supply-chain hardening) — provenance/minimumReleaseAge
- ADR-0007 (vanilla-extract) — decisão irmã; `font.family.*` são tokens do contrato
- `specs/004-design-tokens/` — spec, research.md (R1), data-model.md
