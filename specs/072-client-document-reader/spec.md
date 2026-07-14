# Feature Specification: Leitor de documento client-side por gabarito

**Feature Branch**: `072-client-document-reader`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Leitor client-side por gabarito que pré-preenche os campos do Lançar Documento a
partir do arquivo que o operador sobe (XML por leiaute, PDF pela camada de texto por modelo). Aditivo à ingestão
do backend; onde ambos têm o campo, o client (mais preciso) vence."

> **Variante `-fe`.** Descreve o **quê**; o **como** (módulos, binding, pureza) vive no `plan.md`. A decisão
> arquitetural (extração no front por gabarito) está em **ADR-0021**.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Pré-preenchimento instantâneo a partir do XML (Priority: P1)

O operador sobe o **XML** da nota (NFS-e nacional, ABRASF/ginfes, São Paulo, ou NF-e produto modelo 55). Antes
mesmo de o backend responder, o formulário de "Lançar Documento" aparece **pré-preenchido** com tipo, número,
série, competência, emissão, valor bruto, descrição e retenções — cada campo lido **aceso em âmbar com a tag
"OCR"**. O operador revisa e salva.

**Why this priority**: XML é a fonte de precisão máxima (cada valor já rotulado, sem ambiguidade). É o caminho
dominante com a padronização federal e entrega o maior ganho de tempo com o menor risco de erro.

**Independent Test**: subir um `.xml` de cada leiaute em `/financeiro/contas-a-pagar/lancar` e verificar o
mapeamento campo-a-campo + o destaque âmbar, sem depender do backend.

**Acceptance Scenarios**:

1. **Given** a tela de Lançar Documento, **When** o operador sobe um XML de NFS-e nacional, **Then** tipo=NFS-e,
   número, competência (MM/AAAA), emissão (data), valor bruto e retenções (ISS/IRRF/INSS/PIS/COFINS/CSLL > 0)
   aparecem preenchidos e destacados.
2. **Given** um XML de NF-e produto (modelo 55), **When** subido, **Then** tipo=DANFE, número, série, emissão,
   valor total e chave de acesso (44 dígitos) aparecem preenchidos.
3. **Given** um XML cujo CNPJ do emitente casa com um parceiro ativo, **When** subido, **Then** o fornecedor é
   **selecionado automaticamente**; se não casar, o campo fica manual (não inventa referência).

### User Story 2 - Pré-preenchimento a partir do PDF por gabarito (Priority: P2)

Quando só há **PDF** (DANFSe v1/v2, NFS-e São Paulo "FILU", DANFE), o sistema lê a **camada de texto** do PDF
(coordenadas reais, não OCR de imagem), detecta o **gabarito** do documento e extrai os campos pelos rótulos
âncora. Mesma UX de destaque âmbar.

**Why this priority**: cobre o caso em que o operador só tem o PDF. Precisão alta em PDFs digitais; degrada
graciosamente (nenhum campo) em PDF sem camada de texto (escaneado).

**Independent Test**: subir um PDF de cada gabarito (fixtures sintéticas de camada de texto) e verificar o
mapeamento + a detecção do gabarito correto.

**Acceptance Scenarios**:

1. **Given** um PDF DANFSe v1, **When** subido, **Then** número, competência, emissão, valor bruto e retenções
   são extraídos pela estratégia de coluna/regex.
2. **Given** um PDF sem camada de texto (escaneado), **When** subido, **Then** nenhum campo é preenchido pelo
   leitor (degradação graciosa) e o fluxo do backend segue normal.

### User Story 3 - Precedência aditiva sobre a ingestão do backend (Priority: P2)

A ingestão do backend (`POST /financial/documents/ingest`) **continua** criando o rascunho e o web view do
arquivo **continua** aparecendo. Onde o leitor client-side e o rascunho do backend têm o mesmo campo, o **valor
do client vence** (é mais preciso). O operador nunca perde o preview nem o rascunho.

**Acceptance Scenarios**:

1. **Given** um arquivo que dispara ingestão do backend E leitura client-side, **When** ambos resolvem, **Then**
   os campos que o leitor client preencheu prevalecem sobre os do rascunho, independentemente da ordem de
   chegada (client vence mesmo se o rascunho hidratar depois).
2. **Given** a leitura client-side falha mas o backend ingere, **When** resolve, **Then** os campos do rascunho
   backend permanecem (fallback), sem regressão.

### Edge Cases

- XML de leiaute desconhecido / PDF sem gabarito reconhecido → leitor retorna `null`, nada é preenchido, sem erro.
- Valores monetários "-"/vazios na DANFSe → tratados como 0 (não destacam, não sobrescrevem com lixo).
- Arquivo não-XML/PDF → leitor ignora; a allowlist de upload já barra antes.
- CNPJ do emitente com pontuação/alfanumérico (Serpro 2026) → normalizado antes de casar com parceiro.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE ler o arquivo subido no client e pré-preencher os campos do Lançar Documento.
- **FR-002**: O sistema DEVE priorizar XML (parse por leiaute) sobre PDF (gabarito por camada de texto).
- **FR-003**: O roteamento de XML DEVE seguir a ordem NF-e produto → NFS-e SP → ABRASF/ginfes → NFS-e nacional,
  detectando por marcador do leiaute.
- **FR-004**: O leitor de PDF DEVE ler a camada de texto (coordenadas via pdf.js a partir dos **bytes do File**),
  agrupar linhas, detectar o gabarito e extrair por âncora de rótulo (direita/abaixo/coluna/regex).
- **FR-005**: O sistema DEVE marcar em âmbar + tag "OCR" os campos preenchidos pelo **leitor client** (precedência
  do client), sem quebrar o destaque derivado do rascunho backend quando o leitor não atuar.
- **FR-006**: O sistema DEVE tentar casar o CNPJ do emitente contra a lista de parceiros já disponível no client;
  casou → seleciona `supplierRef`; não casou → mantém manual.
- **FR-007**: O sistema NÃO DEVE remover a ingestão do backend nem o web view do arquivo (aditivo).
- **FR-008**: Onde leitor e rascunho backend têm o mesmo campo, o valor do **leitor client** DEVE vencer,
  independentemente da ordem de resolução.
- **FR-009**: O leitor DEVE degradar graciosamente (retornar o modelo parcial ou `null`) — nunca lançar exceção
  para a UI.

### Key Entities

- **DocumentReading**: modelo unificado de saída do leitor (tipo, número, série, competência, emissão, valor
  bruto, descrição, retenções ISS/IRRF/INSS/PIS/COFINS/CSLL, reforma tributária CBS/IBS, impostos de produto,
  chave de acesso, fornecedor {CNPJ/CPF, nome}). Independente do leiaute de origem.
- **Gabarito**: template de PDF (detector + lista de campos com estratégia de âncora) — DANFSe v1/v2, FILU (SP),
  DANFE.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Para cada leiaute XML e cada gabarito PDF coberto, o mapeamento campo-a-campo é validado por teste
  (fixtures sintéticas), com 100% dos campos-alvo corretos.
- **SC-002**: O pré-preenchimento aparece de forma perceptivelmente instantânea após a seleção do arquivo (sem
  esperar o round-trip do backend).
- **SC-003**: Zero regressão no fluxo existente (ingestão backend + web view + salvar/rascunho).

## Impacto Arquitetural (web-app / BFF)

- **Módulo(s) afetado(s)**: estende `financial` (`client/document-create`). Sem módulo novo.
- **Server functions novas/alteradas**: nenhuma. O leitor é 100% client-side; a `ingestDocumentFn` existente é
  preservada intacta.
- **Integração core-api**: nenhuma nova. Aditivo sobre o `POST /financial/documents/ingest` já consumido.
- **Novos agregados / VOs (server)**: nenhum.
- **Eventos no client (Event Bus)**: nenhum.
- **Design System**: só reuso do destaque âmbar/tag "OCR" existente; sem novos átomos.
- **Dependência nova**: `fast-xml-parser` (parse de XML) — mesma lib do core-api; justificada no plan/ADR-0021
  contra ADR-0008 (mínimo de deps). `pdfjs-dist` já instalado (reuso do #071).
- **Possíveis violações**: nenhuma esperada — parsers e matching são PUROS (node:test); a leitura de PDF é
  imperativa/async isolada em `*.binding.ts` (§XI, ADR-0009). Sem `any` (blueprint reescrito com `unknown` +
  guards). Sem mocks em `src/` (fixtures só em `tests/`, ADR-0011).

## Assumptions

- A lista de parceiros (`usePartnersOptions`) já está disponível no client para o casamento por CNPJ.
- PDFs digitais (DANFSe/DANFE) têm camada de texto; escaneados degradam graciosamente.
- Os valores monetários do leitor vêm em reais; a UI mascara para o campo (reuso de `money.ts`).

## Out of Scope

- OCR de imagem de PDF escaneado (não é gabarito por camada de texto).
- Persistência dos campos lidos no backend (segue pela ingestão + salvar existentes).
- Impostos de produto (ICMS/IPI) não têm campo-alvo no form hoje — carregados no modelo, não mapeados à UI.
