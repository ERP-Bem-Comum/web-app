# Research — Telas de Colaboradores

Decisões tomadas (todas resolvidas; sem NEEDS CLARIFICATION pendentes).

## D1 — Caminho das rotas

- **Decisão**: `/parceiros/colaboradores`, `/parceiros/colaboradores/adicionar`, `/parceiros/colaboradores/editar/:id`, `/parceiros/colaboradores/:id`.
- **Rationale**: consistência com os irmãos já entregues (`/parceiros/fornecedores`, `/parceiros/financiadores`, `/parceiros/atos`). O épico 008 citava `/colaboradores` solto, mas isso precede a convenção `/parceiros/*`.
- **Alternativa rejeitada**: `/colaboradores` solto — quebraria a consistência de navegação do módulo.

## D2 — Filtro de idade (FR-003)

- **Decisão**: derivar a idade no client a partir de `dateOfBirth` (campo do cadastro completo), no `collaborator-list.view-model.ts`. Sem filtro de idade no servidor; **sem** filtro "programa".
- **Rationale**: FR-012 do épico 008 — backend descartou esses filtros. `dateOfBirth` é opcional (só existe após o cadastro completo).
- **Regra para `Pré Cadastrado` sem `dateOfBirth`**: quando um filtro de idade está ativo, colaboradores sem data de nascimento ficam **fora** do resultado (não há como afirmar a faixa). Documentado para o teste do view-model.

## D3 — Import CSV (sem análogo direto)

- **Decisão**: componente novo `import-collaborators-dialog` — input de arquivo, lê `File.text()`, valida `text/csv` e tamanho (≤ 2 MiB) com Zod no client, envia a string para `importCollaboratorsFn`, exibe `{ criados, falhas }` com as linhas inválidas.
- **Rationale**: contrato do épico 008 (CSV-only; parsing + anti-injeção no server/domain). O server-fn `import-collaborators` já existe.
- **Alternativa rejeitada**: parsing no client — viola Princ. VIII (mínimo de libs) e duplica regra do servidor.

## D4 — Desativar com Motivo

- **Decisão**: modal com `<select>` de Motivo populado pelo enum do servidor (`DeactivationReasonSchema`); botão "Desativar Colaborador(a)" desabilitado enquanto não houver motivo. Usa `deactivateCollaboratorFn`. Reativação via `reactivateCollaboratorFn` para inativos.
- **Rationale**: FR-007 da spec; reaproveita o contrato existente.

## D5 — Enums de domínio → i18n

- **Decisão**: rotular no client os enums do contrato — `occupationArea` (PARC/DDI/DCE/EPV → "Área"), `employmentRelationship` (CLT/PJ → "Vínculo"), `RegistrationStatus` (pre-registration/complete → "Pré Cadastrado"/"Cadastrado") — via catálogo i18n `partners.collaborator.*`.
- **Rationale**: invariante de i18n (sem literais de UI). Os valores crus vêm do servidor.

## D6 — Padrão de implementação

- **Decisão**: espelhar `act-*` (molde mais próximo: list+create+edit+detail) e reusar componentes de design system já usados por supplier/act.
- **Rationale**: reduz risco; o lint já aprova esse padrão.
