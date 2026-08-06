# 097 — Exportar conciliação: tira o OFX da tela e destrava o que dá pra destravar

**Tamanho:** S (mudança de UI + regra de habilitação; sem nova rota, sem novo estado)
**Origem:** pedido da P.O. em 2026-08-06
**Branch:** `feat/recon-export-sem-gate`

## Pedido

No footer da Conciliação, o menu "Exportar conciliação":

1. **Excluir da tela o formato `.OFX`** — "esse nunca será ativado".
2. **Manter as demais formas** de exportar.
3. **Flexibilizar as regras:** hoje só dá pra exportar se a conciliação estiver totalmente concluída **e** o
   período fechado. A P.O. quer exportar **a qualquer momento, sem impedimento**.

## O que foi apurado antes de mexer

O menu tinha 3 itens (OFX, CSV do Nibo, PDF) e **dois gates diferentes**, não um só:

| item           | gate real                                       | natureza                     |
| -------------- | ----------------------------------------------- | ---------------------------- |
| OFX / CSV Nibo | existir um **registro de período** para a conta | contrato da rota do core-api |
| Relatório PDF  | existir conta + intervalo resolvido em tela     | puro front                   |

A cadeia que a P.O. percebeu como "precisa concluir tudo e fechar o período" é real e vem daqui:

- A rota é `GET /financial/reconciliation-periods/**:id**/export?format=…` — **keyed por `periodId`**.
- No core-api, o **único escritor** de período é `POST /financial/reconciliation-periods/close`
  (port `application/ports/reconciliation-period-store.ts` expõe só `close` e `reopen`).
- Fechar o período, por sua vez, exige zero pendências (`canClose`).
- Logo: sem conciliação concluída → sem fechamento → **sem `:id`** → sem export de texto.

**Achado que muda o diagnóstico:** o backend **não exige período fechado para exportar**. Nem
`export-reconciliation.ts` nem `export-reconciliation-nibo.ts` checam `status`; ambos usam o período apenas
como carona para `(debitAccountRef, periodStart, periodEnd)`. Um período reaberto (`status: 'Open'`) exporta
normalmente. Ou seja: a trava é de **assinatura de rota**, não de regra de negócio.

## Decisão

| #   | Decisão                                                                                                                              | Onde    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| D1  | OFX sai da **tela**; o formato continua existindo no BFF e no core-api                                                               | front   |
| D2  | PDF fica **sem nenhum impedimento** de conciliação/fechamento — já era assim tecnicamente, mas a UI escondia isso                    | front   |
| D3  | CSV do Nibo **não** pode ser liberado só no front; fica desabilitado com motivo **acionável** até o core-api aceitar conta+intervalo | handoff |
| D4  | Some a linha global "Nenhum período de conciliação nesta conta ainda"                                                                | front   |

Sobre **D1**: a P.O. pediu para excluir _da tela_. Removida a porta de entrada, não o transporte — o
`format=ofx` segue servido pelo core-api e tipado no BFF. Arrancar o formato inteiro seria uma mudança de
contrato que ninguém pediu.

Sobre **D4**: com o OFX fora e o PDF livre, uma linha global anunciando "nenhum período" fazia o menu
**inteiro** parecer bloqueado quando só um item estava. O motivo virou tooltip **por item**:

- CSV: _"A planilha do Nibo exporta um período já fechado — feche o período uma vez para habilitar"_
- PDF: _"Selecione um período para imprimir o relatório"_ (só quando não há intervalo resolvido)

Isto segue a lição de [[disabled-precisa-parecer-disabled]]: quem está barrado precisa saber **por quê** e
**o que fazer**. "Nenhum período" descreve; "feche o período uma vez" orienta.

## Aceite

- [x] O menu não exibe mais o item OFX — sobram CSV (Nibo) e PDF.
- [x] Sem período fechado, o **PDF exporta normalmente** (não há mais impedimento aparente).
- [x] Sem período fechado, o CSV fica desabilitado com o motivo acionável.
- [x] Nenhuma linha global de bloqueio no topo do menu.
- [ ] Validar em tela (P.O.).

## Rastro

- `components/export-menu.component.tsx` — item OFX removido; gates e tooltips separados por item.
- `shared/i18n/catalog.pt-BR.ts` — chaves `export.ofx`/`ofxHint`/`noPeriod`/`pdfUnavailable` (morta) saem;
  entram `export.csvNeedsPeriod` e `export.pdfNoRange`.
- `tests/…/export-menu.spec.tsx` — cobre a ausência do OFX e o caso central: sem período fechado, CSV
  desabilitado **e PDF habilitado**.
- `tests/…/reconciliation-workspace.page.spec.tsx` — asserção do OFX migrada para o CSV.

## Fica pendente (backend)

`GET /financial/reconciliation-periods/:id/export` precisa de uma forma de exportar **por conta + intervalo**,
sem `periodId`. É o que falta para o CSV do Nibo cumprir "exportar a qualquer momento". Issue no core-api.
