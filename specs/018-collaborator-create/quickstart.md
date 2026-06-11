# Quickstart — 018-collaborator-create

## Validação em tela (stack de pé: ../ERP-INFRA/local/up.sh → https://app.localhost)

1. **Botão Novo (RBAC)** — `/parceiros/colaboradores`
   - Com `collaborator:write`: o botão **Novo** aparece no cabeçalho.
   - Clicar → vai para `/parceiros/colaboradores/criar`.

2. **Criar colaborador (happy path)** — `/parceiros/colaboradores/criar`
   - Preencher: Nome, E-mail, CPF, Área (select), Cargo, Início do Contrato (data), Vínculo (select).
   - Salvar → volta para a listagem e o novo colaborador aparece.

3. **Validação (sad path)**
   - Deixar um obrigatório vazio / e-mail inválido / CPF curto → "Salvar" desabilitado ou erro no campo; sem chamada ao servidor.
   - Erro do servidor (ex.: duplicidade) → mensagem legível, permanece na tela com dados.

## Testes
- **node:test (puros):**
  - `collaborator-create.view-model`: cada `PartnersError` → tag correta (espelha supplier).
  - `collaborator-form.controller`: `canSubmit` (todos válidos → true; faltando campo → false); `submit()` monta o `CreateCollaboratorInput` correto.
- **Vitest/jsdom (DOM):**
  - `collaborator-form.component`: renderiza os 7 campos; selects com as opções de enum; dispara `onSubmit` com o input; exibe `errorTag`.
  - (opcional) `collaborator-list.page`: botão "Novo" aparece só com `canCreate`.

## Gate
- `pnpm verify` (typecheck + lint + node) + `pnpm test:dom`. Sem regressão na lista nem nos outros submódulos.
