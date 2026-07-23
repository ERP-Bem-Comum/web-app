# 089 — Motor de palpite: auto-navegar ao ENTRAR na aba Conciliação

> Escala **S/M**. Pedido da P.O.: o motor de palpite deve estar "sempre ativado" na aba Conciliação —
> ao entrar, landar numa transação COM palpite; ao conciliar, avançar sozinho pra próxima.

## Estado anterior (o que JÁ existia)

- Auto-select no **load inicial / novo extrato** (quando nada estava selecionado) → 1ª pendente com palpite.
- **Auto-avanço ao conciliar** por match (`setPendingAdvance` → efeito com `nextPendingWithMatch`) — já pronto.

## Gap (o que faltava)

Ao **entrar na aba** com uma transação **sem palpite** JÁ selecionada, o engine **não** redirecionava — o
auto-select só disparava quando a seleção era `null`. Então voltar do Extrato (seleção persiste) podia deixar o
usuário parado numa transação sem sugestão.

## Decisão

Helper PURO `engineTarget` decide o alvo da seleção na aba:

- fora da aba / palpites não assentados / sem nenhum match → não mexe;
- nada selecionado (load/novo extrato) → `fallbackId` (1º match, ou topo se não há match) — comportamento antigo;
- **acabou de ENTRAR na aba e a tx atual NÃO tem palpite → o próximo COM palpite** (`firstMatchId`), só se existir;
- já dentro da aba, navegando à mão → **respeita a escolha** (não "chuta" o usuário de volta).

O binding detecta a entrada na aba com um `prevTabRef` e aplica o alvo. O auto-avanço ao conciliar segue no
efeito de `pendingAdvance` (inalterado).

## Fora de escopo

- **Forçar o toggle "Exibir palpites" ligado** na aba (remover a opção de desligar): não feito — o toggle segue
  (default ligado; o engine depende dele para ter sugestões). Decisão de produto se quiser travá-lo.

## Verificação

`pnpm typecheck` + `pnpm verify` + `pnpm test:dom` verdes; lint 0. Cobertura nova: `engineTarget` (6 casos:
load, entrada-fora-de-match, entrada-em-match, sem-match, navegação-à-mão, fora-da-aba). Validado em tela:
sair pra Extrato numa tx sem palpite e voltar → pula pra uma com palpite; conciliar → avança sozinho.
