# CON-ACT-CONTRACTOR-RAZAO-SOCIAL — Identificação do ACT como contratado deve ser a Razão Social

**Status**: todo (aguardando backend)
**Origem**: solicitação da stakeholder (web-app v2) — grid/detalhe/inclusão de **contratos** quando o contratado é um **ACT**.

## Problema

Quando o contratado de um contrato é um **ACT**, a identificação exibida (grid de contratos, tela de detalhe e bloco "Contratado" da inclusão) usa o **nome do objeto do acordo** (ex.: "Acordo de Cooperação de educação"). A stakeholder quer que a identificação seja a **Razão Social** da instituição parceira (campo `corporateName` em "Dados da Instituição Parceira" do ACT).

O front exibe `contractor.snapshot.name`. Hoje o `core-api` envia, no snapshot do contratado, **apenas**:

```jsonc
"snapshot": { "name": "string", "document": "string", "bankAccount": ..., "pixKey": ... }
```

Para ACT, `name` = nome do objeto. **Não há** `corporateName`/razão social no snapshot → o front não consegue exibir a razão social (nem no grid, nem no detalhe, nem na inclusão pós-persistência).

> O grid de **ACT no módulo de Parceiros** já mostra a Razão Social (`corporateName`) — este ticket é só sobre o ACT **como contratado em Contratos**.

## Pedido ao backend

Para contratado do tipo **act**, no snapshot do contratado (criação + GET detalhe/lista de contratos), **uma das opções**:

1. **(preferido)** Gravar `snapshot.name` = **Razão Social** (`corporateName`) do ACT — assim o front não muda; OU
2. Acrescentar `snapshot.corporateName` (+ opcional `fantasyName`) ao snapshot do contratado; o front passa a exibir `corporateName ?? name` para ACT.

Também alinhar o **agregador de busca de contratado** (usado na inclusão): para ACT, o item retornado deve permitir identificar pela Razão Social (mesmo critério acima), para a seleção já exibir a razão social.

## Aceite
- Grid de contratos, detalhe e inclusão exibem a **Razão Social** do ACT como identificação do contratado.
- Consistência entre o que aparece na inclusão (seleção) e o que fica persistido (detalhe).

## Notas / estado do front
- Front pronto para exibir: o tipo `Contractor` já tem `corporateName?`/`fantasyName?`. Quando o backend enviar (opção 2) ou ajustar o `name` (opção 1), o front reflete sem retrabalho.
- Sem este backend, o front mantém o nome do objeto (dado atual) — não há razão social disponível no snapshot.
