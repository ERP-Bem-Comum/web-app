# Quickstart: Gestão de Parceiros (`partners`)

**Feature**: `specs/008-partners/` · Como rodar e validar o módulo durante o desenvolvimento.

## Pré-requisitos

- Estar na branch `008-partners`.
- pnpm 11; deps instaladas (`pnpm install`).
- (Opcional, integração real) stack local de parceiros: `../ERP-INFRA/local` (`./up.sh` → `https://app.localhost`).
  O core-api expõe parceiros em **`/api/v1`** (não `/api/v2`). Contrato ao vivo: `GET /docs/json`.

## Desenvolvimento

```bash
pnpm dev            # vite dev (porta 3000)
```

Rotas da feature (file-based, sob área autenticada):
- `/colaboradores` · `/colaboradores/adicionar` · `/colaboradores/detalhes/:id` · `/colaboradores/editar/:id`
- `/fornecedores[...]` · `/financiadores[...]`
- `/estados` · `/municipios` (dual-panel, telas únicas)

## Modo de dados (real × mock)

A API do core-api (`/api/v1`) cobre **toda a superfície** dos 5 sub-domínios (incl. import/export/catálogo/
territorial) — ver `api-readiness-report.md`. Portanto a Fase 1 integra **real** em tudo.
- **Real** (default): financiadores, fornecedores (CRUD + export + catálogo), colaboradores (CRUD + import), estados, municípios.
- **Mock** (opcional, só dev offline): a composição mock dos gateways permanece disponível como ponto de
  troca (ADR-0001 / R-002), mas não é mais necessária. Trocar mock↔real **não** altera UI/ViewModel (SC-005).

⚠️ **Import de colaboradores**: o core-api espera `text/csv` cru — a server function do BFF converte o
upload multipart do browser em texto antes de chamar `POST /api/v1/collaborators/import`.

## Testes

```bash
pnpm test            # puro (node:test): VOs, use-cases, view-models, repositories — imports RELATIVOS
pnpm test:dom        # DOM (Vitest/jsdom): pages/components/binding/controller
pnpm test:all
```

Casos-chave a cobrir (TDD — escreva antes):
- VO `CPF`/`CNPJ`/`UF`/`PixKey` rejeitam inválidos (MF-001).
- Situação cadastral só avança `Pré → Cadastrado` (MF-003).
- Desativar Colaborador: botão desabilitado sem Motivo (MF-004).
- Dual-panel: add/remove imediato e cross-state (Municípios).
- Gateway mock↔real: mesmo contrato (MF-005).

## Gate de qualidade (antes de concluir)

```bash
pnpm typecheck && pnpm lint && pnpm test:all && pnpm build
```

`pnpm lint` cobra: boundaries (client não importa server/domain), so-tokens (sem hex/px cru no `ui/`),
MVVM (views burras sem data-hook), i18n. Verifique também: bundle sem token (SC-004 — grep por
`accessToken`/`refreshToken`/`Bearer`).

## Validação manual (E2E leve)

1. Criar pré-cadastro de colaborador → situação `Pré Cadastrado`.
2. Completar cadastro → `Cadastrado`.
3. Filtrar lista (painel toggle não fecha ao aplicar).
4. Desativar com Motivo (botão habilita só após selecionar).
5. Fornecedor: criar com 3 seções; linha clicável → detalhe.
6. Estados: add (+→"Adicionado") / remove (−) imediato.
7. Municípios: selecionar UF → lista; adicionar; trocar UF → selecionados permanecem.
