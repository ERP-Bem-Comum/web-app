# Quickstart — Login com a identidade visual

## Pré-requisitos

- Design system (spec 005) e tokens (spec 004) já no projeto.
- Asset `public/images/backgroundLogin.png` portado da v1 (tarefa desta feature).

## Rodar e ver

```bash
pnpm dev          # vite dev (porta 3000) → abrir /login
```

Esperado: fundo da marca cobrindo a tela, card branco centralizado com logo no topo, título + subtítulo,
campos Email/Senha (com placeholder), checkbox "lembrar", botão ciano "Entrar". Ao enviar: o botão
desabilita e mostra o **spinner** (anel girando), sem trocar o texto.

## Validar (gates)

```bash
pnpm test:dom     # comportamento/estrutura: login-view.spec + button.spec (loading)
pnpm test         # node:test: tokens (color.surface.canvas) sincronizados
pnpm typecheck
pnpm lint         # só-tokens + boundaries + views burras
pnpm build        # CSS estático (zero-runtime) emitido
```

## Checklist de aceite (mapeado aos SC da spec)

- [ ] **SC-001/005**: comparar lado a lado com `../v1` (`/login`) — enquadramento (fundo, card, logo, ciano) corresponde.
- [ ] **SC-002**: `pnpm lint` verde (zero cor/medida crua nos `*.css.ts` da tela e do Button).
- [ ] **SC-003**: fluxo de login (sucesso, erro, lembrar, redirect) inalterado — `login-view.spec` verde + smoke manual.
- [ ] **SC-004**: navegar só por teclado → foco visível em cada campo/botão; erro com `role=alert`; spinner com nome acessível "carregando".
- [ ] **SC-006**: reduzir a janela para ~320px → card não transborda, permanece legível.
- [ ] **Spinner a11y**: ativar "reduzir movimento" no SO → spinner suaviza (não some); texto "carregando" presente.

## E2E manual (stack local)

`docker compose up -d` → `https://app.localhost` → login com `admin@bemcomum.dev` / `DevPassw0rd!2024`.
Conferir no DevTools que o cookie `__Host-session` continua opaco e **não há token** em response/JS
(comportamento de auth inalterado — FR-009).
