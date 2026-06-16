# Quickstart — Contas a Pagar (v1)

## Pré-requisitos

- **Backend financeiro** disponível: `core-api` em `#38` (módulo `/api/v2/financial`). ⚠️ a **lista é stub** (vazia) — o grid mostra estado vazio por design na Fatia 1.
- Stack local completa (front + back + Caddy): `../ERP-INFRA/local/up.sh` → `https://app.localhost` (shell autenticado).
- Permissões no seed do core-api: `fiscal-document:read|write|cancel`, `payable:approve` (senão 403).

## Rotas

- Grid: `https://app.localhost/financeiro/contas-a-pagar`
- Lançar Documento: `https://app.localhost/financeiro/contas-a-pagar/lancar`

## Rodar

```bash
pnpm dev            # vite dev (3000) — ou via a stack (app.localhost)
```

## Testes (TDD — escrever antes)

```bash
# Puros (node:test) — domain/view-model/mappers/io
node --experimental-strip-types --test tests/modules/financial/server/domain/money.test.ts
pnpm test            # toda a suíte pura

# DOM (Vitest jsdom) — páginas/componentes/controllers
pnpm test:dom tests/modules/financial/client/document-create/document-form.spec.tsx
pnpm test:dom        # toda a suíte DOM

# Gate antes de fechar
pnpm verify          # typecheck + lint + testes
pnpm test:visual     # após mexer em UI/CSS (stack de pé)
```

## Fluxo de verificação manual (smoke)

1. Abrir o **grid** → ver colunas + chips + **estado vazio** ("nenhum documento") + botão "Novo Documento". (Lista vazia = correto, não é erro.)
2. Clicar **"Novo Documento"** → cai em **Lançar Documento**.
3. Preencher um **NFS-e** com fornecedor, valores e **uma retenção (ISS)** → ver **preview do líquido**; confirmar → documento criado **Aberto** com **título pai + filho ISS** (verificável via `GET /documents/:id`).
4. Tentar um tipo **≠ NFS-e/RPA** → bloco de retenções **indisponível**.
5. Forçar **líquido ≤ 0** → bloqueio com mensagem clara (sem código HTTP).

## Definição de pronto (v1)

- `pnpm verify` verde; `pnpm test:visual` verde (telas tocadas).
- Grid (shell + estado vazio + navegação) e Lançar Documento (criar + preview + gating) funcionando ponta-a-ponta contra a Fatia 1.
- Itens deferidos (drawer, bulk, filtro/visões, busca/ordenação/contadores) **não** entram — documentados na spec.
