# ADR-0021: Leitura de documento fiscal no client por gabarito (aditiva à ingestão do BFF)

**Feature**: `specs/072-client-document-reader/` · **Status**: Accepted
**Data**: 2026-07-14

> ADR transversal do frontend v2. Registra a decisão de extrair campos do documento **no navegador**, por
> técnica de gabarito, revertendo — para esta técnica específica — a posição anterior de que "extração no front
> é inviável" (que valia para OCR de imagem genérico). Não substitui nenhum ADR aceito.

## Contexto

O fluxo "Lançar Documento" hoje ingere o arquivo via `POST /financial/documents/ingest` (#062): o BFF cria um
rascunho e o operador o revisa. Na prática o rascunho vem **incompleto** — o leitor de PDF do core-api ainda
falha em vários PDFs digitais (#386/#388) e o fornecedor vem NULL (o CNPJ→parceiro não é casado no backend).
O operador acaba redigitando.

Um spike anterior concluiu que "extração de PDF no front é inviável" — mas aquele spike mirava **OCR de imagem
genérico** (datas coladas, CNPJ confundido com chave). A consultoria entregou uma técnica diferente e precisa:

- **XML por leiaute**: a DANFSe/DANFE (PDF) é só a representação visual do XML; o XML traz cada valor já
  rotulado e sem ambiguidade — precisão de 100%, sem posição de texto nem reconhecimento de imagem.
- **PDF por gabarito de camada de texto**: lê o **texto real embutido** no PDF (coordenadas via pdf.js), não
  pixels. Detecta o modelo do documento e extrai por rótulo âncora. Alta precisão em PDFs digitais.

As forças em jogo: (1) o backend está parado nesses gaps; (2) a UX ganha muito com pré-preenchimento
instantâneo (sem esperar o round-trip); (3) a constituição exige núcleo agnóstico de framework (§XI, ADR-0009),
erros como valores (§II) e TS estrito sem `any` (§VI); (4) a CSP (ADR-0006) proíbe `fetch` de `blob:` — os bytes
do PDF têm de vir do próprio `File`.

## Decisão

Implementamos um **leitor client-side por gabarito**, **aditivo** à ingestão do BFF. A ingestão do backend e o
web view continuam; onde o leitor client e o rascunho do backend têm o mesmo campo, **o valor do client vence**
(é mais preciso). O leitor:

- roteia **XML primeiro** (NF-e produto → NFS-e SP → ABRASF/ginfes → NFS-e nacional, por marcador de leiaute) e,
  na ausência de XML, cai no **gabarito de PDF** (camada de texto, sem OCR de imagem);
- expõe um modelo unificado `DocumentReading` mapeado para os campos do formulário; o CNPJ do emitente é casado
  contra os parceiros já carregados no client (casou → seleciona; não casou → manual, sem inventar referência);
- é **PURO** no núcleo (parsers XML + motor de gabarito = `node:test`, sem React/DOM/I/O); a única parte
  imperativa/async (pdf.js `getTextContent` sobre `file.arrayBuffer()`) fica isolada num `*.binding.ts`
  client-only. Degrada graciosamente: retorna o modelo parcial ou `null`, **nunca** lança exceção para a UI.

O blueprint da consultoria (que usava `any` e `node:fs`) foi **reescrito** com `unknown` + type guards e leitura
a partir dos bytes do `File` (não de blob URL — a CSP `connect-src 'self'` não cobre `blob:`).

**Fundamentação canônica** (citação ≥4 linhas):

> "Push complexity to the leaves. A well-designed module hides its complexity behind a simple interface... The
> best modules are deep: they provide powerful functionality through a simple interface. A shallow module, by
> contrast, has an interface that is almost as complex as its implementation."
> — _(A Philosophy of Software Design, John Ousterhout, cap. 4 "Modules Should Be Deep")_

O motor de gabarito é um **módulo profundo**: por trás de `read(file) → DocumentReading | null` esconde todo o
agrupamento de linhas, as estratégias de âncora e os leiautes. A UI só vê a interface simples.

## Consequências

- **Positivas**: pré-preenchimento instantâneo e preciso; independe dos gaps do backend (#386/#388); casa
  fornecedor por CNPJ (melhora o que o backend hoje deixa NULL); núcleo puro 100% testável por leiaute; aditivo
  (zero regressão — se o leitor falhar, o rascunho do backend segue).
- **Negativas / custo**: +1 dependência (`fast-xml-parser`) contra o princípio de mínimo de deps (§VIII, ADR-0008)
  — mitigada por ser a **mesma lib do core-api** (paridade de árvore XML) e madura; gabaritos são calibrados por
  modelo e podem exigir ajuste quando uma prefeitura muda o leiaute do PDF (o XML é imune a isso).
- **Ponto de troca / reversibilidade**: a leitura vive atrás de `useDocumentReader()` (binding) + mapa puro. Para
  desligar, basta não cablear o patch na página — a ingestão do backend volta a ser a única fonte. Cada gabarito
  é um registro isolado; adicionar/remover leiaute não toca o motor.

## Alternativas consideradas

| Alternativa                         | Por que rejeitada                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| Só ingestão do backend (status quo) | Rascunho incompleto (PDF reader falha, fornecedor NULL); operador redigita       |
| OCR de imagem no front              | Já provado inviável (ruído: datas coladas, CNPJ vs chave) — spike anterior       |
| Empurrar tudo pro backend e esperar | Backend parado nesses gaps; perde a janela de go-live e a UX instantânea         |
| Ler o PDF via blob URL (`fetch`)    | CSP `connect-src 'self'` bloqueia `blob:` — usar bytes do `File` é a via correta |
| Parser de XML DIY / regex           | Frágil e anti-padrão; `fast-xml-parser` (a lib do core-api) é robusta e madura   |
