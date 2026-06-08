# Request — CTR-HTTP-DOCUMENT-CONTENT

> Handoff do **front (web-app v2)** para o **core-api**. Padrão `000-request.md`.
> Origem: tela de detalhe do contrato — preview/baixa do documento anexado. Verificado contra
> `core-api@dev` em 2026-06-08.

## Título
Expor o conteúdo do documento anexado (preview + download)

## Size
S/M

## Contexto
Na tabela de Documentos do contrato, cada linha (contrato base e aditivos) tem o documento assinado
anexado. O front precisa **pré-visualizar** o PDF em modal (sem sair da página, sem baixar) e **baixar**
o arquivo. Hoje não há como obter os bytes do documento.

## Estado atual (verificado)
Rotas de documento existentes (`src/modules/contracts/adapters/http/plugin.ts`):
- `POST /contracts/:id/documents` (upload, octet-stream)
- `POST /contracts/:id/amendments/:amendmentId/documents` (upload do doc do aditivo)
- `POST /contracts/:id/documents/:documentId/supersede`
- `DELETE /contracts/:id/documents/:documentId`

**Não existe** rota que **devolva o conteúdo** (bytes) nem **URL** do documento. O `getDocument` retorna
apenas metadados (parentType/parentId/storageKey/hash…). O storage é MinIO (bucket/storageKey), mas não há
proxy de stream nem URL pré-assinada exposta. O mapper do front marca `url: ''` ("rota futura").

### Sintoma observado em tela (2026-06-08)
Na tabela de Documentos, a **seta de download fica desabilitada inclusive em aditivos `Homologado`** —
ou seja, aditivos que **comprovadamente têm o documento assinado anexado** (o status Homologado só é
atingido após o upload + homologação). O documento existe no storage, mas o front não tem como obtê-lo
porque **nenhum** documento expõe URL/conteúdo. Mesma limitação para o contrato base efetivado.
Além disso, o detalhe (`GET /contracts/:id`) traz `documents` só no nível do contrato e **não associa
documento ↔ aditivo** — então o front também precisa saber **qual documento pertence a qual aditivo**
(ex.: incluir os documentos dentro de cada `amendment`, ou um campo de URL/id de documento no próprio aditivo).

## Gap (o que falta)
Uma forma de o browser obter o PDF **via BFF** (o browser nunca fala com core-api/MinIO direto):
- (a) `GET /contracts/:id/documents/:documentId/content` → stream do arquivo (`application/pdf`,
  `Content-Disposition` p/ download), auth `contract:read`, ownership do documento ↔ contrato; **ou**
- (b) `GET /contracts/:id/documents/:documentId/url` → **URL pré-assinada** de leitura (curta duração) do MinIO.

## Escopo (proposta para o core-api)
- Implementar (a) **ou** (b) acima, com verificação de **ownership** (o documento deve pertencer ao
  contrato `:id`, direto ou via aditivo daquele contrato — mesma checagem já usada no DELETE).
- Suportar tanto documento de **contrato** quanto de **aditivo**.

## Fora de Escopo
- Edição/versionamento de documento (já há supersede/delete).

## Critérios de Aceitação
1. Dado um documento existente, o front consegue **renderizar a prévia** (PDF inline) sem baixar.
2. O front consegue **baixar** o arquivo com o nome original.
3. Acesso negado a documento de outro contrato (ownership) e sem `contract:read`.

## Notas técnicas (consumidor: front web-app v2)
- A prévia já está pronta na UI: `DocumentPreviewModal` (abre no ícone de olho) renderiza `<iframe src=url>`
  quando houver `url`; hoje exibe placeholder porque `url` vem vazia.
- O download já está como `<a download href=url>` quando há `url`; sem `url`, o botão fica desabilitado.
- Religação no front: preencher `Contract.files[].url` / `Amendment.signedContractUrl` (ou um endpoint
  de conteúdo) no mapper do BFF (`apiDocumentToDomain`/`apiAmendmentToDomain`).
- Espelho de upload já implementado: `octetStreamFetch` + `POST /:id/documents`.
