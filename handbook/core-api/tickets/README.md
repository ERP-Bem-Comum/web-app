# Handoff Front → Core-API — Contratos

> Índice consolidado das pendências de backend e dos achados resolvidos no front durante a **validação
> em tela** do módulo Contratos (web-app v2). Verificado contra `core-api@dev` em 2026-06-08.
> Cada item de backend tem um ticket no padrão `000-request.md` nesta pasta.

## 🟥 Pendências de BACKEND (precisam de ação no core-api)

| Ticket | Tema | Resumo | Bloqueia no front |
|---|---|---|---|
| [CTR-HTTP-DISTRATO-DOCUMENTO](./CTR-HTTP-DISTRATO-DOCUMENTO.md) + [binding-map](./CTR-HTTP-DISTRATO-DOCUMENTO.binding-map.md) | Distrato rico | O distrato existe (`POST /contracts/:id/end` `{kind:Terminate}`) mas é "cru": não recebe **documento assinado**, **data efetiva** nem **motivo**. Religação do front ao `/end` fica com o tech lead. | Distrato efetiva de verdade (hoje a UI coleta os campos; submit ainda usa stand-in) |
| [CTR-HTTP-DOCUMENT-CONTENT](./CTR-HTTP-DOCUMENT-CONTENT.md) | Conteúdo do documento | Não há rota que devolva **bytes/URL** do documento (só upload/supersede/delete). Detalhe não associa **documento ↔ aditivo**. | Preview e **download** (seta desabilitada mesmo em aditivos Homologado, que têm doc) |

### Pendências de backend conhecidas, ainda SEM ticket (alinhamento P.O./tech lead)
- **Persistência de metadados do contrato**: programa, categoria, centro de custo, plano orçamentário,
  classificação (CT/OS) — não há colunas; hoje exibidos como "—" no detalhe.
- **`signedAt` por aditivo** — o aditivo não expõe data de assinatura própria (coluna "Assinatura" fica "—").
- **Numeração sequencial de aditivo** no backend (hoje o front exibe `AD NN-XXXX/ANO` derivado por ordem de criação).

## 🟩 Achados RESOLVIDOS no FRONT (sem ação de backend — registro)

| Achado | Causa | Correção (front) |
|---|---|---|
| **Aditivo não era criado** (qualquer tipo) | `createAmendment`/`update` mandavam `Content-Type` duplicado → core-api **415** → erro genérico | Removido o header redundante (o `resultFetch` já injeta) — alinhado ao padrão de `create`/`activate` |
| **Aditivo de valor SUPRESSÃO falhava** | Front mandava `kind: Addition` + valor **negativo** → core-api **`money-negative-value` (422)** | Sinal decide o kind: negativo→`Suppression` (valor absoluto), positivo→`Addition`. Na leitura, `Suppression`→valor negativo (convenção de sinal). Exibição com "− R$" |
| **Descrição/valor inválidos viravam "erro inesperado"** | `AmendmentDescriptionRequired` / `AmendmentImpactValueZero` / `money-negative-value` não mapeados | UI exige descrição (e valor > 0); slugs mapeados → `invalid-value` |
| **Datas 1 dia atrás** (vigência/fim) | `YYYY-MM-DD` vira meia-noite UTC → recua em BRT | Formatação em `timeZone: 'UTC'` |
| **Grid: coluna Aditivos sempre "—"** + vigência não estendia | Lista não propagava `children`/`currentPeriod` | BFF `list` enriquece itens com `children`, `currentPeriod`, `currentValue` |

## ℹ️ Notas de modelagem (para o tech lead validar)
- **Distrato** é transição de ciclo de vida (`/end`, Terminate), **não** um aditivo. No front, por ora, o
  tipo "Distrato" vive na modal de aditivo (UI/coleta de campos pronta) — a religação correta é via `/end`.
- **Escopo / Outro / Distrato** todos mapeiam para `Misc` no backend → ao reler, perde-se o subtipo
  (aparecem como "Outro"). Se o subtipo importar no backend, precisaria de `kind` próprio ou um campo.
