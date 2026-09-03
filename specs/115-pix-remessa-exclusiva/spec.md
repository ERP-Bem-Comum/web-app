# 115 — PIX só sai em remessa EXCLUSIVA de PIX

**Tamanho:** M · **Status:** implementada e **em serviço** · **Data:** 2026-09-03
**Onde:** Contas a Pagar → pré-voo da remessa (VAN) · `remittance-preview.view-model.ts` +
`remittance-preview-modal.component.tsx` · **core-api#948, CA4**

## A decisão

> "Habilita só em remessa com todas as transações com o pagamento do tipo Pix. Se acontecer de
> selecionar Pix e TED junto, o Pix deve ficar desmarcado. Então o sistema deve alertar ao usuário."
> — P.O., 03/09/2026

O desempate é **assimétrico de propósito**: quem cai é o **PIX**, nunca o TED, o boleto ou a guia. A
remessa das outras formas segue como estava; o PIX vai numa remessa própria.

## ⚠️ Não confundir com a exclusividade de ARQUIVO — que já existe

O `fileGroupFor` do core-api **já** põe o PIX em grupo próprio: o arquivo nunca sairia misto, isso é do
layout. O que esta régua acrescenta é a exclusividade da **REMESSA** — um lote, uma modalidade, um
comprovante, um retorno.

Sem ela, uma seleção mista geraria **dois arquivos no mesmo lote**, cada um queimando o seu NSA — e o
NSA é global por remessa (decisão da P.O.) e compartilhado entre contas no multipag. É esse o dano que a
régua evita, não o arquivo misto.

## Como fica na tela

O pré-voo passou a ter **duas passadas**, e a divisão é o desenho:

1. **por linha** — o veredito do backend + a régua de emissor. Cada título julgado isolado.
2. **pela seleção inteira** (`applyPixExclusivity`) — a única que precisa olhar as OUTRAS linhas.

O que o operador vê quando a seleção é mista:

- as linhas PIX ficam **desmarcadas e não-marcáveis**, com a pendência
  `PIX só sai em remessa exclusiva de PIX — desmarque os títulos das outras formas de pagamento`;
- um **aviso no topo**, com a contagem, dizendo as duas saídas: desmarcar as outras formas **ou** gerar
  o PIX numa remessa separada.

**O aviso do topo não é redundante com a pendência da linha.** O título caiu por causa de OUTRA linha:
sem o aviso, numa lista longa o operador veria o PIX sumir do total sem nada explicando por quê.

### A régua lê o que está MARCADO agora, não a seleção que veio do grid

Desmarcando os títulos das outras formas, a seleção vira exclusiva e as linhas PIX **voltam a ficar
operáveis**. Sem isso, sair de uma seleção mista para uma remessa PIX exigiria voltar ao grid e
recomeçar. Não circula: a régua só desmarca PIX, e desmarcar PIX não muda o que ela pergunta (se há
não-PIX marcado) — uma passada basta.

### PIX já impedido por outro motivo não é tocado

Ele continua exibindo a **sua** pendência, que é a que o operador precisa ler. Trocá-la por "não é
remessa exclusiva" esconderia o motivo verdadeiro atrás de um efeito colateral — e esse PIX também não
entra na contagem do aviso, porque ninguém o desmarcou: ele já estava fora.

### Rota desconhecida (`null`) barra o PIX

Lado seguro da dúvida: a régua exige que **todas** as transações sejam PIX, e uma rota que não sabemos
qual é não prova isso.

## O que mais mudou na mesma entrega: a mitigação da 111 SAIU

Esta régua **substitui** a mitigação de tela da [spec 111](../111-pix-sem-emissor-preflight/spec.md), e
as duas mudanças são uma só — foi a ordem que a P.O. fixou na #948:

> "A régua de exclusividade é o que substitui essa mitigação: ela entra na mesma mudança em que o
> `'pix'` sai daquele conjunto. Enquanto o emissor da #936 não estiver em homologação, as duas juntas
> seriam duas réguas dizendo coisas diferentes sobre o mesmo título."

**Por que agora:** o **core-api#936** (emissor de PIX, par A+B na forma `45`) está na `dev` desde
01/09, no `1.0.0-rc.2`, e o **core-api#837** fez o backend nomear a rota sem emissor (`no-issuer`).
Com isso, `ROUTES_WITHOUT_EMITTER`, `routeHasEmitter`, `NO_EMITTER_PENDENCY` e a chave
`pendency.pixNoEmitter` saíram. A tela não infere mais nada pela rota: `ready` é `ready`, e quem diz
que uma rota não emite é o backend.

**A ordem importa nos dois sentidos.** Liberar o PIX sem a exclusividade deixaria a seleção mista gerar
dois arquivos no mesmo lote (o `allocateNsa` está dentro do laço dos grupos), cada um queimando um NSA.
Manter as duas juntas com o PIX ainda bloqueado seria duas réguas discordando sobre o mesmo título.

## ⚠️ A régua do servidor (CA4) ainda NÃO existe

A #948 está **aberta, sem PR**. Até ela entrar, a exclusividade vive **só na tela** — e a rota da
geração continua alcançável sem passar por aqui. Não é o desenho final; é a metade que protege o
operador enquanto a outra não chega.

## O que este trabalho NÃO faz

- **Não substitui a régua do servidor** (acima) — a recusa 4xx antes do `allocateNsa` segue pendente.
- Não antecipa as recusas do emissor de PIX que o pré-voo ainda não consulta (CA1/CA2 da #948: chave
  acima de 99 posições, `keyType` fora do `G100`). Título com chave longa continua aparecendo apto na
  tela e sendo recusado na geração.
- Não mexe no `fileGroupFor` nem na partição — a exclusividade de **arquivo** já era do layout.
- Não mexe em TED, transferência, boleto ou guia: nenhuma dessas cai por esta régua.

## Testes

`pnpm verify` (1893) e `pnpm test:dom` (729) verdes. Em `remittance-preview-view-model.test.ts`:

- **`selectionAllowsPix`** — só-PIX, misto, vazio, e rota `null` (que barra, pelo lado seguro da dúvida).
- **`applyPixExclusivity`** — o PIX cai e o TED não; desmarcar o não-PIX libera; pendência alheia
  preservada e fora da contagem; boleto e guia derrubam igual.
- **`toPreviewView`** — a régua na composição inteira: o PIX desmarcado com a contagem no topo, o total
  da remessa sem ele, a seleção só-PIX passando limpa, e o caminho de volta (desmarcar o TED no grid
  devolve o PIX operável).
- **A inversão da 111** — o teste que cravava "PIX `ready` NÃO entra" agora crava o oposto, de
  propósito: reintroduzir o bloqueio de tela por engano quebra o gate. E a linha que o **backend** marca
  `no-issuer` continua barrada, com a frase que não pede correção de cadastro.
