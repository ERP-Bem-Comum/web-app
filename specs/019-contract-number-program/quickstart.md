# Quickstart — Validação 019 (numeração + programa/classificação)

Pré-requisitos: stack local de pé com core-api **#32** (`feat/backlog-front-handoff`), banco limpo. Login: `admin.full@bemcomum.dev` / `DevPassw0rd!2024` (acesso total).

## Gates (após implement)
```bash
pnpm verify          # typecheck + lint + node:test (puros)
pnpm test:dom        # vitest/jsdom
```
Esperado: 0 erros de typecheck; 0 errors no lint (warnings = baseline); testes verdes.

## Validação em tela (https://app.localhost)
1. **(pré) criar um Programa** em Gestão de Programas (para ter UUID real) — anotar a sigla.
2. **Criar contrato CT** com programa selecionado:
   - Classificação = Contrato; preencher campos; selecionar o Programa criado.
   - Salvar → sucesso, sem erro. Abrir o detalhe.
   - ✅ Número exibido = `CT NNNN/2026` (gerado pelo backend, **não** aleatório).
   - ✅ Programa preenchido (sigla) no detalhe.
3. **Criar contrato OS**:
   - Classificação = Ordem de Serviço → salvar.
   - ✅ Número exibido com prefixo `OS NNNN/2026`.
4. **Grid de contratos**:
   - ✅ Coluna **Programa** mostra a sigla (não "—") para os contratos com programa.
   - ✅ Números reais e crescentes; prefixo CT/OS correto por linha.
5. **Contrato sem programa**:
   - ✅ Coluna Programa = "—" sem erro; detalhe com campos vazios/"—".
6. **Sad path**: forçar erro de backend no create → ✅ mensagem amigável (i18n), permanece no form.

## Critérios de sucesso (spec)
- SC-001 número atribuído pelo sistema (zero inventado) · SC-002 CT/OS correto · SC-003 Programa real no grid · SC-004 create OK (sem regressão) · SC-005 zero regressões (`verify`+`test:dom`+tela).
