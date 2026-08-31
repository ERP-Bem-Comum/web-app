# 111 — PIX não entra na remessa enquanto o emissor não tiver o trilho

**Tamanho:** S · **Status:** implementada (mitigação temporária) · **Data:** 2026-08-28
**Onde:** Contas a Pagar → pré-voo da remessa (VAN) · `remittance-preview.view-model.ts`

## Problema

Duas réguas discordavam, e o operador pagava a conta.

O pré-voo do core-api devolve **`ready`** para título PIX com chave cadastrada (`payout-readiness.ts`: rota
`pix` + chave → apto). O emissor **recusa** a rota (`batchProfileFor` → `remittance-launch-form-unsupported`),
e o montador **aborta o arquivo inteiro** — decisão correta, porque remessa parcial pagaria uns fornecedores
e silenciaria outros.

Resultado: a linha aparecia verde e somada no total "pronto"; **um único título PIX derrubava a remessa dos
demais**, e só no clique de gerar — com erro genérico, porque o backend colapsa o slug (OWASP) e o
`financialErrorTag` não tem caso para ele.

Na base local havia 1 título PIX aprovado e 9 TED: bastava ele entrar na seleção.

## Regra

> Enquanto o emissor não tiver o trilho, PIX **não é remissível** — e a tela diz o porquê, sem pedir
> correção de cadastro (não há cadastro a corrigir).

## Por que a régua ficou no front

A resposta do pré-voo **não traz** o `unplannedCount`/`unplannedTotalCents` que o `batch-planner` calcula.
Sem esse número não há como avisar por dado do backend — então a régua é pela **rota**, que a resposta já
informa. É segunda régua, e isso é dívida assumida: **sai quando o backend expuser o não-planejado**
(pedido registrado na core-api#890).

## ⚠️ `tax-guide` fica de fora — por decisão

O emissor recusa `tax-guide` do mesmo jeito, e uma retenção por guia numa seleção derruba o arquivo igual.
Mas essa é a rota das **retenções**, e a #794 decidiu que retenção apta segue remissível ("destacar, não
travar"). Levado à P.O. em 29/08 com o modo de falha explicado — **decisão: manter como está**. O risco
é conhecido e aceito; o conserto certo é o emissor (core-api#838), não a tela.

Há teste cravando a ausência da barreira, para que reintroduzi-la por engano quebre o gate.

## O que este trabalho NÃO faz

- Não conserta a emissão — PIX segue sem trilho no CNAB (core-api#890 traz o layout completo, medido de um
  golden do banco + o manual Multipag).
- Não nomeia o erro da geração — o slug continua colapsado no backend.
- Não mexe em `billet` nem `transfer`, que têm emissor.

## Testes

`pnpm verify` (1865) e `pnpm test:dom` (725) verdes. `remittance-preview-view-model.test.ts` (+5): PIX
`ready` não entra e diz o porquê; um PIX na seleção não arrasta os remissíveis junto; `tax-guide` e as rotas
com emissor seguem passando.
