# HANDOFF — Conciliação Bancária (front 034) · dependências de backend

**Data:** 2026-06-19 · **De:** Front (web-app, feature `034-bank-reconciliation`) · **Para:** Tech Lead / core-api

O front da Conciliação Bancária está **construído e commitado** (8 user stories, gates verdes), consumindo o
contrato do **PR #152** (`/api/v2/financial`). Onde o backend ainda não atende, a UI é **chrome honesto**
(estado anunciado, sem dado fabricado — ADR-0011). Abaixo, o que falta no backend e **o que cada entrega
destrava** no localhost.

## Ordem sugerida de priorização

| Prioridade | Issue                                                                                           | Destrava no front                                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 1       | **core-api#176** — registrar `reconciliation:*` no `permission-catalog`/`permission.ts` do auth | **Acesso**: o admin (seed dev) passa a receber `reconciliation:read/import/write/close` → o menu **Conciliação** aparece e a rota abre com o **login normal** (hoje só via hack de preview).            |
| 🔴 2       | **core-api#152 no ambiente local** (hoje `../core-api` está no #109; #152 está em `origin/dev`) | **Fluxo real**: importar OFX/CSV → conciliar por sugestão → N:1/parcial → manual/lote → desfazer → fechar período rodam ponta a ponta (via conta placeholder; o import não valida o `debitAccountRef`). |
| 🟠 3       | **core-api#168** — conta-cedente: listar/criar/obter/saldo/contagens (HTTP)                     | **Grid de contas (TELA 1)** popula com dados reais (hoje é chrome "aguardando #168"); seleção real de conta no workspace (cai o UUID placeholder); "Nova Conta Bancária" passa a persistir.             |
| 🟡 4       | **core-api#175** — expor `reconciliationId` na listagem de transações (ou lookup por transação) | **Desfazer** funciona após recarregar a página (hoje só p/ conciliações da sessão). Também alimenta o modal "Detalhes da conciliação".                                                                  |
| 🟡 5       | **core-api#174** — sugestões de match **em lote** por extrato                                   | **Palpite por linha** (alta/média/sem match) na lista de movimentações (hoje só pendente/conciliado; a banda aparece só no painel da transação selecionada).                                            |
| 🟡 6       | **core-api#172** — enriquecer sugestões/títulos com **nome do fornecedor + nº do documento**    | Match card e grid de títulos exibem fornecedor/nº doc (hoje só documento/valor/vencimento/forma).                                                                                                       |
| 🟢 7       | **core-api#173** — listar períodos / obter `periodId` fora do fechamento                        | **Exportar conciliação** (OFX/CSV) na bottombar (hoje desabilitado/anunciado). Fechar período já funciona.                                                                                              |
| 🟢 8       | **core-api#145** — importar **PDF via OCR**                                                     | Opção "PDF" no menu Importar (hoje anunciada/desabilitada). OFX/CSV já funcionam.                                                                                                                       |

> #176 e #152 são o que mais destravam: com os dois, o time consegue **validar a Conciliação no localhost,
> com login normal, junto dos demais módulos** (`../ERP-INFRA/local/up.sh` → `https://app.localhost`).

## Notas

- **Dinheiro** = string de centavos; **datas** ISO; **só títulos `Pago`** são conciliáveis.
- **Costura pronta** no front (porta/gateway/server-fn) para cada lacuna — ligar é trocar o adapter, sem
  refactor de fronteira.
- Issues abertas no repo `ERP-Bem-Comum/core-api`: #145, #168, #172, #173, #174, #175, #176.
