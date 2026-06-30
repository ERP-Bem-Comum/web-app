# Data Model — 018-collaborator-create

## Entrada do formulário = `CreateCollaboratorInput` (domínio existente)

| Campo | Tipo | Controle UI | Validação na borda | i18n |
|---|---|---|---|---|
| `name` | string | input texto | obrigatório, 1–200 | `partners.collaborators.create.name` |
| `email` | email | input email | obrigatório, formato e-mail | `...create.email` |
| `cpf` | string | input texto (máscara opcional) | obrigatório, 11–14 chars (dígitos) | `...create.cpf` |
| `occupationArea` | enum `PARC \| DDI \| DCE \| EPV` | select | obrigatório, dentro do enum | label: `partners.collaborators.area.<v>` (existe) |
| `role` | string | input texto | obrigatório, 1–120 | `...create.role` |
| `startOfContract` | data `YYYY-MM-DD` | input date | obrigatório, data válida | `...create.startOfContract` |
| `employmentRelationship` | enum `CLT \| PJ` | select | obrigatório, dentro do enum | label: `partners.collaborators.employment.<v>` (existe) |

## Regras de validação (controller, na borda)
- Todos os 7 campos são obrigatórios → `canSubmit` só habilita com todos preenchidos e válidos.
- `email`: formato (o domínio valida com `z.email`; o front barra antes de enviar).
- `cpf`: ≥ 11 dígitos (remover não-dígitos para contar).
- `occupationArea` / `employmentRelationship`: começam vazios ("selecione…") e exigem escolha.
- Erros do servidor (ex.: duplicidade) → `errorTag` via `partnersErrorTag` → tag i18n exibida sem sair da tela.

## Estados (Command do binding)
- `running` (mutating), `errorTag: string | null`, `execute(input)`.
- Sucesso → invalida `['collaborators']` e navega para `/parceiros/colaboradores`.

## Fora do modelo (não enviados)
- `registration`/`activation` (status) — definidos pelo backend no cadastro inicial (pré-cadastro).
