---
paths:
  - "src/shared/ui/**/*.ts"
  - "src/shared/ui/**/*.tsx"
  - "**/*.css.ts"
---

# Regras — Design System (só-tokens · vanilla-extract)

Fonte: ADR-0007, ADR-0008; constituição §X; `handbook/ARQUITETURA.md` §7.

## Invariantes

- **vanilla-extract é o engine (ADR-0007, §X):** estilos em `*.css.ts`, **zero-runtime**, type-safe. Panda/Tailwind foram rejeitados — mudar exige ADR novo.
- **Só tokens:** use `vars.*` de `#shared/ui/tokens`. **Proibido** hex/px cru em componentes.
- **Atomic Design, só "para baixo":** `tokens ← atoms ← molecules ← organisms`. Um átomo não importa molécula/organismo.
- **Webfonts self-hosted via `@fontsource` (ADR-0008):** sem CDN, sem woff2 manual.
- **Papéis de cor da marca:** ciano `#32C6F4` = ação; índigo `#464E78` = chrome/navegação; `#E8EEF0` = fundo. Tipos de parceiro mapeiam para tokens — nunca cor solta.
- **i18n:** texto ao humano vem de tags i18n, não string hardcoded na view.

> Em conflito, vence: ADR > constituição > este arquivo > `eslint.config.js`.
