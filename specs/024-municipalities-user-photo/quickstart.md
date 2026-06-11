# Quickstart / Validação em tela — 024 Municípios parceiros adicionados

> Stack local de pé (`../ERP-INFRA/local/up.sh` → `https://app.localhost`), login `admin.full@bemcomum.dev`.

## Pré-condição de dados
Garantir municípios marcados como parceiros em **≥ 2 UFs diferentes** (ex.: Arapiraca/AL e Sobral/CE):
na tela "Estados e Municípios" → seção Municípios → selecionar uma UF na "Lista Geral" → adicionar um
município; repetir com outra UF. (Lembrete: município pode ser parceiro mesmo se a UF não for.)

## Cenários

1. **Painel "Adicionados" cross-state (FR-001/FR-002/SC-001)**
   - Abrir "Estados e Municípios" → seção Municípios.
   - O painel direito "Municípios Parceiros Adicionados" lista **todos** os municípios parceiros, de UFs
     distintas, mostrando **nome + UF**. O contador bate com o total.

2. **Busca (FR-003/SC-002)**
   - Digitar um termo na busca do painel "Adicionados" → a lista filtra por nome (e/ou UF) sem recarregar.

3. **Consistência com a Lista Geral (FR-004/SC-003)**
   - Adicionar um novo município (Lista Geral, por UF) → ele **aparece** no painel "Adicionados".
   - Remover um município → ele **some** do painel "Adicionados". Tudo sem recarregar a página.

4. **Vazio (FR-005)**
   - Sem nenhum município parceiro → painel "Adicionados" mostra estado vazio claro (não o placeholder antigo,
     não erro).

5. **Sem regressão (FR-006/FR-008/SC-004)**
   - Estados (dual-list) seguem funcionando; Lista Geral de municípios por UF segue adicionando/removendo;
     demais telas de parceiros intactas.

## Gates (antes de concluir)
- `pnpm typecheck` 0 · `pnpm lint` 0 erros · `pnpm test` (node) e `pnpm test:dom` (vitest) verdes vs baseline.
- **NÃO** commitar antes da validação em tela (a usuária commita).
