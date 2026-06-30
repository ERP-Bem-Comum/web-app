---
name: pipeline-maestro
description: >
  Conduz o pipeline spec-driven do web-app (.specify) ESCALANDO POR TAMANHO (S/M/L).
  Use quando iniciar/avançar qualquer trabalho que mude src/: classifica o tamanho,
  cria/atualiza os documentos certos em specs/<###-slug>/ a partir dos templates .fe.md,
  e garante os gates. Independe das skills speckit-* (lê os templates direto).
---

# Pipeline Maestro (spec-kit, escala por tamanho)

## Fonte
`.specify/memory/constitution.md` (§I–§XII), `.specify/templates/*.fe.md`, `.specify/workflows/`,
`handbook/adr/`. A feature corrente fica em `.specify/feature.json` (`feature_directory`).

## Passo 0 — Classifique o tamanho
- **S** — fix pontual / 1–2 arquivos / sem decisão nova → **doc leve**: descrição no PR/commit; abra **ADR** (skill `adr-author`) só se houver decisão arquitetural.
- **M** — feature pequena → `spec.md` + `plan.md`.
- **L** — feature/refactor amplo → ciclo completo `specify → plan → tasks → implement` com gates.

## Passo 1 — Garanta a pasta da feature
Se não houver, crie via script do kit:
```bash
bash .specify/scripts/bash/create-new-feature.sh --json "<descrição curta>"
```
Isso cria a branch `###-slug` e `specs/###-slug/`. Fixe em `.specify/feature.json` se necessário.

## Passo 2 — Gere/atualize os documentos (templates .fe.md)
| Etapa | Lê template | Produz | Onde |
|---|---|---|---|
| specify | `spec-template.fe.md` | `spec.md` | `specs/###/spec.md` |
| plan | `plan-template.fe.md` | `plan.md` (com **Constitution Check** §I–§XII) | `specs/###/plan.md` |
| tasks | `tasks-template.md` | `tasks.md` (fases + US P1/P2/P3) | `specs/###/tasks.md` |
| implement | — | arquivos em `src/` | `src/modules/...` |
| (decisão) | `adr-template.fe.md` | ADR | `handbook/adr/NNNN-*.md` |

Gates humanos: **review-spec** (após spec) e **review-plan** (Constitution Check) antes de codar.

## Passo 3 — Implemente e feche
Delegue a implementação aos orquestradores de camada. Ao fim, rode o gate (skill `ts-quality-checker`)
e o `bem-comum-verify` do kit (`.specify/extensions.yml → after_implement`). **Regressão zero**:
não feche com typecheck/lint/test vermelho.

## Regra de ouro
Sempre deixe **algum** documento criado/atualizado e coerente com o código — proporcional ao tamanho.
