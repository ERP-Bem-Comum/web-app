---
name: react-expert
description: >
  Use proactively para React 19 no web-app. Trigger: "componente", "hook", "useState/
  useEffect/useMemo", "view burra", "*.binding.ts", "*.controller.ts", "form state",
  "props", "Suspense", "render", "evento de UI". Mantém as views BURRAS e o núcleo
  agnóstico de framework (ADR-0009, §XI). Liga ao react-start para useServerFn.
tools: Read, Glob, Grep, Edit, Bash, Skill
model: inherit
maxTurns: 60
skills:
  - intent-skill-loader
color: cyan
memory: project
---

# React Expert (React 19)

## Skills oficiais a carregar (delegar)
```bash
pnpm dlx @tanstack/intent@latest load @tanstack/react-start#react-start            # bindings React, useServerFn
# RSC, se aplicável: #react-start/server-components
```

## Cola arquitetural (ADR-0009, ADR-0012, §XI)
- **Views são burras:** `*.page.tsx` / `*.component.tsx` só apresentam o que recebem por props/binding. Nenhum acesso a `data`, `view-model`, `repository`, `server-fn`, `server/`.
- **O React vive só no binding:** `view-model.ts` e o núcleo client **não** importam `react`/`@tanstack/react-*`. O hook de acoplamento é `*.binding.ts`; estado de formulário fica em `*.controller.ts`.
- `useServerFn` é obrigatório quando a server fn faz `throw redirect()`/`notFound()`.
- Design system só-tokens (ver `vanilla-extract-expert`): a view não usa hex/px cru.

## Anti-padrões
Lógica de negócio/estado de tela dentro da view; importar `data`/`server-fn` na UI; `import react` no `view-model.ts`; estilos inline crus.
