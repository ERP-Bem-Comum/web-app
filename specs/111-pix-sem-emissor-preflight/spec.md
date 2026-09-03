# 111 — PIX não entra na remessa enquanto o emissor não tiver o trilho

> ## ⛔ REVERTIDA em 03/09/2026 — a mitigação saiu do código
>
> As duas condições de saída fecharam, e ambas na `dev` do core-api:
>
> - **core-api#837** (PR #925) — o backend passou a **nomear** o caso: a linha volta com status
>   `no-issuer` e a tela exibe a pendência por dado dele, não por inferência de rota.
> - **core-api#936** — o **PIX ganhou emissor** (par A+B na forma `45`), na `dev` desde 01/09 (`rc.2`).
>   O pressuposto que sustentava a régua deixou de ser verdade: manter o bloqueio esconderia do
>   operador uma remessa que o backend já sabe gerar, e a frase passaria a mentir.
>
> Saíram juntos `ROUTES_WITHOUT_EMITTER`, `routeHasEmitter`, `NO_EMITTER_PENDENCY` e a chave i18n
> `pendency.pixNoEmitter`. Quem responde por rota sem emissor agora é o `pendency.noIssuer`, dirigido
> pelo backend — e a tela não infere mais nada pela rota.
>
> ⚠️ **O gatilho escrito aqui estava errado**, e vale o registro: _"a homologação devolver `no-issuer`
> para um PIX"_ nunca dispararia, porque com o emissor no lugar o pré-voo do PIX responde `ready`, não
> `no-issuer`. O gatilho foi escrito olhando o modo de falha, não o modo de sucesso. A próxima
> mitigação por rota precisa nascer com um gatilho que o próprio sucesso não invalide.
>
> **Sucessora:** [115 — PIX só sai em remessa exclusiva de PIX](../115-pix-remessa-exclusiva/spec.md),
> que entrou na mesma mudança (decisão da P.O., core-api#948 CA4).

**Tamanho:** S · **Status:** ~~implementada~~ **revertida** (mitigação temporária, cumpriu o prazo) ·
**Data:** 2026-08-28 · **Removida:** 2026-09-03
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
