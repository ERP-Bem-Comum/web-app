# Request — PRG-LOGO-CONTENT

> Handoff do **front (web-app v2)** para o **core-api**. Padrão `000-request.md`.
> Origem: Gestão de Programas → grid (coluna **Logo**) + telas de **inclusão/detalhe** (campo "Logo do
> Programa"). Verificado contra `core-api@dev` em 2026-06-10.

## Título
Servir a **imagem do logo** do programa (GET por `logoKey`/URL) e, idealmente, aceitar logo na criação

## Size
M

## Contexto
O design mostra o **logo** do programa no grid (coluna Logo) e nas telas de inclusão/detalhe
("Logo do Programa", com ícone de upload). O `GET /programs` e o `GET /programs/:id` retornam `logoKey`.

## Estado atual (verificado)
- Existe **upload**: `POST /api/v1/programs/:id/logo` (octet-stream image/png|jpeg|webp, ≤ 5 MiB) → `{ logoKey }`.
- **Não há GET** que devolva os **bytes** nem uma **URL** renderizável a partir do `logoKey` — então o front
  não consegue **exibir** o logo (só teria a chave opaca).
- O `POST /programs` (criação) **não** aceita o binário do logo no corpo (só `name/sigla/director/
  generalCharacteristics/logoKey?`). O upload é sempre um 2º passo (após criar, com o id).

## Pedido ao backend
1. **Exibição**: uma rota `GET /api/v1/programs/:id/logo` (bytes) **ou** transformar `logoKey` numa **URL**
   pública/assinada no payload (`logoUrl`) do `GET /programs` e `GET /programs/:id`.
2. (Opcional) **Criação com logo**: permitir enviar a imagem junto do create (multipart) ou confirmar o
   fluxo *create → POST /:id/logo* como o oficial.

## Impacto no front (hoje)
- Grid: coluna **Logo** mostra um **placeholder** (ícone de imagem) — não há como renderizar o real.
- Inclusão/Detalhe: o campo **"Logo do Programa"** está **gated** (desabilitado, com ícone de upload) até
  existir exibição + fluxo definido. Ao haver a URL/rota, basta renderizar a imagem e ligar o upload
  (mutation octet-stream → invalidar `['programs']`).
