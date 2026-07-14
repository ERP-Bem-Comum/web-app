# Spec 070 — Coluna OCR redimensionável (Lançar Documento)

**Tamanho:** S (afeta só o client; sem servidor, sem contrato novo).

## Problema

No "Lançar Documento", a coluna de pré-visualização do documento (OCR) tinha largura fixa
(`minmax(16rem, 32rem)`). Documentos densos (NFS-e com muitas tabelas) ficavam apertados; o
usuário não podia regular quanto espaço dar ao documento vs ao formulário.

## Objetivo

Deixar a **coluna OCR redimensionável pelo usuário** — arraste horizontal por uma alça entre o
preview e o formulário, com teclado (setas) e **persistência** entre sessões.

## Comportamento

- **Alça** (window-splitter) entre a coluna OCR e o formulário: `role="separator"`,
  `aria-orientation="vertical"`, `aria-valuenow/min/max`, focável (`tabIndex=0`).
- **Arraste:** pointer down na alça → move a largura acompanhando o cursor; solta → persiste.
- **Teclado:** ArrowLeft/ArrowRight ajustam em passos de 24px; persiste a cada passo.
- **Limites:** largura clampada em **[16rem, 48rem]** (256–768px); padrão **28rem** (448px).
- **Persistência:** `localStorage` (`lancar-documento:ocr-col-width`), best-effort (SSR/privado degrada
  para o padrão).
- **Responsivo:** abaixo de 75rem o preview e a alça somem (form + sidebar); abaixo de 60rem, coluna única.

## Não-objetivos

- Redimensionar a sidebar (Composição) — fora de escopo.
- Sincronizar a largura entre dispositivos/usuários (é preferência local).

## Arquitetura (§XI · ADR-0009)

- Lógica pura em `ocr-panel-resize.view.ts` (clamp/parse; testada por node:test).
- React só no `ocr-panel-resize.binding.ts` (UI-state + pointer/teclado + persistência).
- A página aplica a largura via CSS var inline `--ocr-col-width` (mesmo padrão do `--ocr-zoom`); o grid do
  `body` consome com `clamp()` de segurança. Só-tokens no CSS (a alça usa `paperRule`/`blueLine`/`blue`).

## Gate

`pnpm verify` verde: typecheck 0 · lint 0 erros · node 1391 (+3) · dom 507.
