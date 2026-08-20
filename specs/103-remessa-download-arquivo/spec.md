# 103 — Baixar o arquivo da remessa (homologação)

**Tamanho:** M · **Status:** implementada · **Data:** 2026-08-20
**Backend:** core-api PR #784 (`484220fc`, mergeado 20/08 às 17:16 UTC, na `origin/dev`)
**Rota:** `GET /financial/remittances/:id/file`
**Depende de:** specs/101 S3 (geração da remessa) — é a tela onde o botão nasce

## Problema

A specs/101 fixou uma premissa: _"o front **nunca baixa nem transporta o arquivo**"_. Ela valia
porque não havia rota — a VAN é um bucket S3, e o transporte é do agente, não do browser.

O backend abriu uma exceção **deliberada e estreita**: em homologação, quem opera precisa **conferir
o layout com o banco**. Para isso não serve arquivo parecido — serve o arquivo que efetivamente foi
gravado em `saida/`. Sem download, a conferência de layout dependia de acesso direto ao bucket, que a
P.O. não tem.

Esta feature **não revoga** a premissa da 101: o front continua sem transportar nada. Ele baixa uma
**cópia para conferência**, e só onde o backend registra a rota.

## O que o backend decidiu (e o front tem de respeitar)

| Decisão                                                     | Consequência para o front                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Não regerar** — serve o objeto do bucket                  | Não existe "baixar de novo com outro NSA". O arquivo é evidência ou não é nada.                                                                  |
| **Procura por NOME**, devolve a chave em `x-van-object-key` | O prefixo é diagnóstico: `falhas/` significa que **o envio não completou**.                                                                      |
| **Confere o `contentHash`**                                 | Hash divergente **não entrega nada** → 503 `remittance-file-corrupted`.                                                                          |
| **Rota não registrada em produção**                         | Lá é **404 por ausência**, não 403 por decisão (ADR-0052 do core-api).                                                                           |
| **`application/octet-stream`**                              | Nunca abrir em aba: `text/plain` deixaria o browser normalizar quebra de linha, e **CNAB com terminador trocado é arquivo recusado pelo banco**. |
| **Reusa `remittance:read`**                                 | Sem permissão nova — permissão nova não chega a ambiente já semeado e vira 403 mudo.                                                             |

## Escopo

Um botão **Baixar arquivo** no comprovante da remessa — a tela que já aparece depois de
_Confirmar e enviar ao banco_ (Contas a Pagar → grid → Exportar → CNAB → Conferir remessa → Gerar
remessa → Confirmar). O `remittanceId` já vem no comprovante (`GeneratedRemittance`); nenhuma busca
extra é necessária.

| #   | Entrega                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `GET /financial/remittances/:id/file` atrás de server fn (§III — o browser nunca fala com o core-api)                    |
| 2   | Botão **Baixar arquivo** no comprovante, com estado de carregando                                                        |
| 3   | Download programático via Blob + `<a download>`, com o nome do arquivo que o backend mandou                              |
| 4   | Aviso quando a chave vier de **`falhas/`** — o envio não completou, e quem confere precisa saber ANTES de comparar bytes |
| 5   | Erro exibido pela **mensagem PT-BR do core-api**, não por tag genérica                                                   |

## Fora de escopo

- Baixar remessa **antiga** (exige a tela de acompanhamento — specs/101 S4, não iniciada). Aqui só se
  baixa a remessa que acabou de ser gerada, enquanto o comprovante está na tela.
- Esconder o botão em produção por flag de ambiente — ver "Em aberto".

## Critérios de aceite

- **CA1** — Dado um comprovante de remessa recém-gerada, **Quando** clico em Baixar arquivo, **Então**
  o navegador salva o arquivo com o nome que o backend informou (`content-disposition`).
- **CA2** — Dado que o objeto veio de `falhas/`, **Quando** o download conclui, **Então** a tela avisa
  que o envio não completou.
- **CA3** — Dado hash divergente (503), **Quando** clico, **Então** **nada é salvo** e a mensagem do
  core-api aparece na íntegra.
- **CA4** — Dado ambiente de produção (rota ausente → 404), **Quando** clico, **Então** a tela diz que
  o download existe apenas em homologação — e nenhum arquivo é salvo.
- **CA5** — O token **nunca** chega ao browser: os bytes trafegam como base64 pela server fn (§IX).

## Em aberto

**O botão aparece em produção e falha lá.** O backend não registra a rota fora de homologação, então o
clique volta 404 com o recado certo — mas a pessoa só descobre depois de clicar, o que contraria o
combinado de que _barrado tem de parecer barrado_. Esconder exigiria expor o ambiente do BFF ao client
(flag em runtime — a imagem Docker é a mesma nos dois ambientes, então `import.meta.env` não serve).
Decisão adiada de propósito: é uma linha de produto, não de engenharia.
