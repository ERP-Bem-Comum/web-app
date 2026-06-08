# Quickstart — validar Telas de Colaboradores

## Pré-requisitos (stack local)
1. Stack de pé (docker): mysql + core-api + web + caddy + minio. (Já no ar nesta máquina via override de PoC.)
2. Login: `admin@bemcomum.dev` / `DevPassw0rd!2024` em `https://app.localhost`.
3. O admin precisa de `collaborator:read`/`collaborator:write` (já concedidos no seed de RBAC de dev).

## Smoke manual (após implementação)
1. Menu "Gestão de Parceiros" → **Colaboradores** aparece (gated por `collaborator:read`).
2. `/parceiros/colaboradores`: a lista carrega (estado vazio "Nenhum colaborador cadastrado").
3. "Novo colaborador" → preencher os 7 campos → salvar → aparece como **Pré Cadastrado**.
4. Abrir o colaborador → "Editar" → completar dados pessoais → salvar → vira **Cadastrado**.
5. Buscar por nome/e-mail e aplicar filtro de idade → lista filtra.
6. Desativar: abrir modal, confirmar que o botão fica desabilitado sem **Motivo**; escolher motivo → inativo.
7. Importar CSV: enviar arquivo válido → `{ criados, falhas }`; arquivo > 2 MiB → recusado.
8. Logar com usuário só-leitura → ações de escrita ocultas/desabilitadas.

## Verificação automatizada
- `pnpm verify` (typecheck + lint + testes puros).
- `pnpm test:dom` (componentes).
- `pnpm test:e2e` (happy/sad espelhando supplier/act), com a stack docker no ar.
