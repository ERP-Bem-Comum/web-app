# Quickstart: validar a feature 017 (anexo + efetivação de contrato)

Pré: stack de pé (`../ERP-INFRA/local/up.sh` ou docker compose com o `docker-compose.poc.yml`), `https://app.localhost`, admin `admin@bemcomum.dev` / `DevPassw0rd!2024` (tem `contract:write`).

> ⚠️ Após editar **server functions/BFF (SSR)**: `docker compose ... restart web`. Após mexer no **routeTree**: regenerar no host (`pnpm dev` rápido) — bug EXDEV no container. Sempre **hard refresh** (`Cmd+Shift+R`) na aba antes de validar.

## US2 — anexar na criação → Em Andamento
1. Contratos → Incluir; preencher obrigatórios; selecionar contratado.
2. No modal de finalização: **anexar um PDF válido** + **data de assinatura** (passada).
3. Confirmar → contrato criado e **ativado**; redireciona pra grade; aparece **EM ANDAMENTO**.
4. Conferir no banco: `status='Active'`, `signed_at` preenchido, 1 linha em `ctr_documents` (categoria `signed_contract`).

## US1 — sem documento → Pendente (regressão preservada)
1. Mesmos passos, **sem** anexar documento → contrato **PENDENTE** na grade. `status='Pending'`, 0 documentos.

## US3 — incluir documento depois → efetiva
1. Num contrato **Pendente** (detalhe), ação **"Incluir documento assinado"** (só visível com `contract:write`).
2. Anexar PDF + data → contrato passa a **EM ANDAMENTO** sem recarregar.

## Sad paths
- **Não-PDF / arquivo corrompido** → bloqueado, mensagem clara, contrato **segue Pendente**.
- **PDF > 20 MiB** → bloqueado antes do envio.
- **Sem data de assinatura** ou **data futura** → confirmação bloqueada.
- **Falha de upload/activate após criar** → contrato fica **Pendente** e recuperável via US3.
- **Sem `contract:write`** → ação não aparece.

## Verificações automatizadas (gate)
```bash
# RED first (TDD): testes de borda e view-model devem falhar antes da implementação
node --experimental-strip-types --test tests/modules/contracts/server/adapters/attach-signed-document.border.test.ts
node --experimental-strip-types --test tests/modules/contracts/client/contract-attach-document/attach-signed-document.view-model.test.ts
pnpm test:dom tests/modules/contracts/client/contract-attach-document/attach-document-modal.spec.tsx

# Gate final (zero regressão)
pnpm verify        # typecheck + lint + node:test (baseline atual + novos)
pnpm test:dom      # Vitest (baseline atual + novos)
pnpm test:visual   # se mexeu em UI/CSS (precisa stack de pé)
```

## Checagem direta no core-api (debug)
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/v2/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@bemcomum.dev","password":"DevPassw0rd!2024"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
curl -s http://localhost:3001/api/v2/contracts -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json;[print(i['sequentialNumber'],i['status']) for i in json.load(sys.stdin)['items']]"
```
