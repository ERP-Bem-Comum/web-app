# 098 — "Conciliar" travado precisa dizer o que falta

**Tamanho:** S (UX + testes; nenhuma regra de negócio nova)
**Origem:** revisão do PR #331, pedida pela P.O. em 2026-08-09
**Branch:** `fix/manual-entry-blocked-reason`

## O que motivou

O PR #331 (par do core-api#671) passou a **exigir categoria + centro de custo** ao conciliar um lançamento
manual de tipo classificável. A regra está certa e espelha o backend com precisão:

|         | core-api (`domain/reconciliation/manual-entry.ts:79`) | front (`manual-entry.binding.ts`) |
| ------- | ----------------------------------------------------- | --------------------------------- |
| exige   | `categoryRef` **e** `costCenterRef`                   | idem                              |
| isentos | `isCapitalReallocation`                               | `requiresDestination`             |

Os dois predicados cobrem o mesmo conjunto — `Transfer`, `Investment`, `Redemption`.

**O problema não é a regra, é o silêncio.** O botão passou a travar sem dizer por quê:

```tsx
disabled={!binding.canSubmit || binding.submitting}   // sem title, sem mensagem
```

E `canSubmit` reunia três condições distintas (tipo, conta de destino, classificação) num único booleano —
então nem o código tinha como explicar qual delas faltava. Antes do #331 o botão quase nunca travava por
classificação, então o problema não existia na prática: ele **nasce com a regra nova**.

É a mesma lição de [[disabled-precisa-parecer-disabled]] (PR #252): "deixe desativado" só funciona se a
pessoa **enxergar** que está barrada — e, aqui, souber onde mexer.

## Decisão

| #   | Decisão                                                                  | Por quê                                                               |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| D1  | O motivo vira a **fonte**, e `canSubmit` a consequência (`=== null`)     | torna irrepresentável o estado "travado sem motivo"                   |
| D2  | A derivação é **pura**, na view-model                                    | §XI — a view-model deriva, o binding só liga ao React                 |
| D3  | O motivo aparece em **texto ao lado do botão**, com `title` como reforço | tooltip não existe no toque e exige adivinhar que há algo a descobrir |
| D4  | Mensagens **nomeiam o campo** que falta                                  | "informe o centro de custo" orienta; "preencha os campos" não         |

Sobre **D1**: em vez de um booleano e uma mensagem calculados em paralelo (que divergem com o tempo),
`manualEntryBlockedTag` devolve a tag do **primeiro** obstáculo — do mais estrutural (tipo) ao mais
específico (campo) — e o `canSubmit` é `=== null`. Não dá para habilitar com pendência nem travar sem texto.

Sobre **D4**: quando faltam os **dois** campos, sai **uma** mensagem ("informe o centro de custo e a
categoria"), não duas em sequência — senão a pessoa resolve, o botão continua travado, e ela descobre o
segundo obstáculo só na segunda tentativa.

## Aceite

- [x] Bloqueado por classificação → motivo em tela + `title` no botão.
- [x] Liberado → sem texto, sem `title`, botão ativo.
- [x] Realocação (Transferência/Aplicação/Resgate) segue **isenta** de classificação.
- [x] Realocação sem destino cobra o **destino**, não a classificação.
- [x] Todo motivo é uma tag existente no catálogo (senão a UI mostraria a chave crua).
- [x] Validado em tela pela P.O. em 2026-08-09 — campos obrigatórios confirmados.

## Rastro

- `reconciliation-workspace.view-model.ts` — `manualEntryBlockedTag` + `ManualEntryGate` (puros).
- `manual-entry.binding.ts` — `canSubmit` deriva do motivo; expõe `submitBlockedTag`.
- `new-transaction-pane.component.tsx` — texto do motivo + `title`.
- `reconciliation-workspace.css.ts` — `ntBlocked` (tom de dica, não de erro: nada falhou ainda).
- `catalog.pt-BR.ts` — 5 motivos.
- `workspace-view-model.test.ts` (+8) · `new-transaction-pane.spec.tsx` (+3).

## Lacuna que este PR fecha, e a que ele não fecha

O #331 chegou **sem teste**: nada fixava que Pagamento sem categoria bloqueia, nem que Transferência segue
liberada. A isenção é a parte frágil — se `requiresDestination` mudar, a divergência com o
`isCapitalReallocation` do backend passaria calada. Agora há teste dos dois lados.

O que **não** muda: o CSV do Nibo segue exportando linhas de Transferência sem categoria (hardcode no
exportador) e as conciliações **já feitas** continuam sem classificação. Isso é a **core-api#664**.
