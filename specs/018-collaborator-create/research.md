# Research — 018-collaborator-create

Sem incógnitas: a feature espelha um padrão já existente e reusa backend pronto.

## Decisões

- **Decision:** Espelhar o slice `supplier-create` (mutation/view-model/binding/page/form).
  **Rationale:** Padrão consolidado no módulo partners; minimiza risco e mantém consistência.
  **Alternatives:** Espelhar `act-create` — equivalente; supplier é o mais completo/atualizado.

- **Decision:** Reusar `collaboratorRepository.create` + server-fn `create-collaborator` (já existentes).
  **Rationale:** Backend/BFF prontos; a feature é só a camada client/UI.
  **Alternatives:** Criar nova fronteira — desnecessário e violaria "não tocar core-api / não recriar".

- **Decision:** Rota importa a page direto (`createFileRoute` → `CollaboratorCreatePage`), sem public-api.
  **Rationale:** É exatamente o padrão de `fornecedores/criar.tsx`; `src/routes` é composition root.
  **Alternatives:** Exportar via public-api — supplier-create não faz; manter o padrão.

- **Decision:** Enums `occupationArea` (PARC/DDI/DCE/EPV) e `employmentRelationship` (CLT/PJ) como `<select>`.
  **Rationale:** Tags i18n já existem (`partners.collaborators.area.*`, `partners.collaborators.employment.*`).
  **Alternatives:** Combobox/radio — overkill p/ poucos valores.

- **Decision:** `startOfContract` como `<input type="date">` (YYYY-MM-DD).
  **Rationale:** Formato esperado pelo `CreateCollaboratorInput` (`z.iso.date()`); nativo.

- **Decision:** RBAC do botão "Novo" via `canCreate` já calculado no `collaborator-list.binding`.
  **Rationale:** Binding já expõe `can(granted, 'collaborator:write')`; só a page não consumia.
