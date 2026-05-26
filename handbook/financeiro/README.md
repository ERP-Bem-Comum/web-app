# Bem Comum ERP — Protótipos HTML

Três telas independentes, cada uma em sua pasta com **HTML, CSS e JS separados**. Cada pasta é autocontida — abre direto no navegador (sem build) e pode ser arrastada inteira pro VS Code.

## Estrutura

```
lancar_documento/    → Módulo Financeiro · Lançar Documento (tela principal de OCR + lançamento)
contrato_detalhe/    → Módulo de Contratos · Contrato preenchido (visualização + aditivos + timeline)
novo_contrato/       → Módulo de Contratos · Novo Contrato (criação do zero, com checklist)
```

Dentro de cada pasta:

```
index.html    → markup + referências externas (link CSS, script JS)
styles.css    → estilos completos (tokens, layout, componentes)
app.js        → comportamento (event handlers, troca de doc type, modais, validações)
```

## Como rodar

Abrir `index.html` direto no navegador funciona — não precisa de build, não há imports de módulos ES. Tudo é CSS e JS vanilla. Fontes externas (Inter, Fraunces, JetBrains Mono) vêm do Google Fonts via `<link>`.

Se precisar servidor local (por causa de algum CORS futuro):

```bash
cd lancar_documento && python3 -m http.server 8000
```

## Design system compartilhado

As três telas usam o mesmo conjunto de tokens (palette ink/paper/teal/amber/orange/green/red e tipografia Inter + Fraunces + JetBrains Mono). Atualmente cada pasta tem seu `styles.css` próprio com os tokens duplicados — pra produção, vale extrair os tokens pra um arquivo compartilhado (`design-tokens.css`) e importar em cada tela.

## Notas de implementação

- **JS está em IIFE** (`(function () { ... })()`) pra evitar poluição do global scope. Quando virar build real, dá pra modularizar com ES modules.
- **Dados mockados** vivem dentro do próprio `app.js` (constantes `DOC_TYPES`, `MOCK_CONTRATADO`, etc). Em produção, esses dados viriam de API.
- **Modais** usam o padrão `.modal-backdrop.open` (toggle de classe) — sem libs externas.
- **Atalhos de teclado**: ESC fecha modal aberto. (Antes existia ⌘A pra "novo aditivo" no `contrato_detalhe`, removido por causa de conflito com o select-all nativo.)

## Decisões pendentes

- Modal real de busca de fornecedor/contratado (hoje é mock — 1 clique popula)
- Integração entre as telas (clicar no chip de contrato no `lancar_documento` deveria navegar pro `contrato_detalhe`)
- Preview real de PDF no fluxo de aditivos (hoje a modal "selada" usa só metadados)
