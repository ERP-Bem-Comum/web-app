# 121 — Editar o território do colaborador

**Tamanho:** M · **Status:** front implementado, aguardando backend · **Data:** 2026-10-12
**Depende de:** `core-api#1053` (o `PUT /collaborators/:id` aceitar `territory`)
**Origem:** pedido da P.O. — habilitar a edição do **Território** depois de cadastrado o colaborador, nos
status **pré-cadastrado** e **cadastrado**.

## Problema

Em Gestão de Parceiros > Colaboradores > detalhe, a seção **Território** (UF + município) ficava sempre
**somente leitura**: o território só entra no cadastro (#42). O motivo é o backend: o
`updateCollaboratorBodySchema` faz `.omit({ ..., territory: true })` e o `Collaborator.edit` não lê o campo.
O BFF espelhava o `omit` (`UpdateCollaboratorInputSchema`), então nada chegava ao core-api.

## Regra (decisões da P.O., 12/10)

- O território passa a ser **editável no modo Editar**, em **pré-cadastrado e cadastrado** (o `edit` do
  core-api preserva o `registrationStatus`; a mesma rota atende os dois).
- **Substituir pode, apagar não** — mesmo padrão do banco/PIX (spec 120). Trocar só a UF ou só o município é
  substituição e vale; o que se barra é esvaziar os dois quando já havia território.
- **Backend:** issue para o tech lead (`core-api#1053`), não implementado por nós.
- **Permissão:** a mesma do botão Editar (`collaborator:write`).

## Contrato do PUT (proposto na #1053)

| Corpo                                                 | Efeito                           |
| ----------------------------------------------------- | -------------------------------- |
| `territory` ausente ou `null`                         | mantém o gravado                 |
| objeto com UF e/ou município                          | valida (UF IBGE) e **substitui** |
| objeto com os dois vazios, havendo território gravado | recusa (sugestão: 422)           |

## Escopo (front)

| #   | Entrega                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------- |
| 1   | BFF: `UpdateCollaboratorInputSchema` e `UpdateCollaboratorInput` deixam de omitir `territory`                   |
| 2   | Controller: `buildTerritory` (algum campo → objeto; os dois vazios → `null` = mantém)                           |
| 3   | Controller: `validateTerritory` barra esvaziar território já gravado (`territory.removal`), junto do `validate` |
| 4   | Tela: no modo Editar, **UF pelo seletor IBGE** (o mesmo do cadastro) e **município** texto livre habilitam      |
| 5   | Mensagem em PT ao esvaziar: "O território pode ser alterado, mas não apagado. Preencha a UF ou o município."    |
| 6   | Cancelar devolve o território original (o `reset` já reidrata do detalhe)                                       |

## Comportamento

- Fora do modo Editar, a seção segue somente leitura.
- Sem território gravado, deixar vazio salva normalmente (vai `null`, nada muda).
- A troca aparece no histórico do colaborador: o `collaborator-history.ts` do core-api já compara `territory`
  e o `editCollaborator` grava o diff após o save. Sai nos **dois CSVs** de histórico — o do detalhe
  (`GET /collaborators/:id/export?type=history`) e o do grid (`GET /collaborators/export?type=history`) —
  porque ambos leem o mesmo repositório de histórico. Linha: `tipo_alteracao` = **Território**, antes/depois
  no formato `UF/Município` (ex.: `CE/Fortaleza` → `SP/Campinas`), mais data e `alterado_por`.

## ⚠️ Ordem de merge

**Não mergear o front antes da #1053 estar na `dev`/hml.** Com o backend atual, o Zod do core-api descarta o
`territory` em silêncio: o PUT responde 204 e a tela mostraria "salvo" com o território antigo.

## Testes

- `tests/modules/partners/client/collaborator-detail/collaborator-detail-form.controller.test.ts` — `buildTerritory`/`validateTerritory` (puro).
- `tests/modules/partners/client/collaborator-detail/collaborator-territory-editable.spec.tsx` — tela (pré-cadastrado e cadastrado, leitura, troca, recusa de esvaziar).
- `tests/modules/partners/server/adapters/collaborator-update-payment-target.test.ts` — borda Zod e corpo do PUT levam `territory`.
- `tests/modules/partners/bank-select-adoption.test.ts` — governança: a borda do PUT não volta a omitir banco/PIX/território.
