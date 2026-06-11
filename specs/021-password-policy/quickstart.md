# Quickstart: validar a política de senha (mínimo 12)

Pré-requisitos: stack local de pé (`../ERP-INFRA/local/up.sh` → `https://app.localhost`), core-api no `dev` (#32). Login: **admin.full@bemcomum.dev / DevPassw0rd!2024**.

## Cenário feliz / bloqueio (US1 / SC-001..003)

1. Logar e abrir **Minha Conta** → **Trocar Senha**.
2. Digitar senha nova com **menos de 12** caracteres → o app **bloqueia** (botão desabilitado) e a checklist mostra "**Mínimo 12 caracteres**" (número vindo da fonte única).
3. Digitar senha com **12+** caracteres atendendo às regras da checklist → o app permite concluir; o backend aceita; sessões revogadas → logout + redirect /login (comportamento existente).
4. (Teto) Tentar senha **acima de 128** → bloqueada com mensagem clara (o teto antigo de 15 não bloqueia mais senhas longas válidas).

## Defesa em profundidade (SC-001, FR-006)

5. Simular indisponibilidade da política (ex.: derrubar core-api momentaneamente / DevTools offline) → o app usa o **fallback 12** e continua bloqueando <12 (nunca mais permissivo).
6. Se o backend recusar por senha comum → mensagem amigável `password-weak`; se recusar por tamanho (`password-too-short`) → mensagem amigável dedicada.

## Regressão (SC-004) — a regra de ouro
7. Confirmar que a Trocar Senha segue exigindo as **regras de complexidade** existentes (maiúscula/minúscula/dígito/símbolo) — nada removido.
8. Demais telas de Minha Conta (editar perfil) e o login inalterados.

## Gates — antes de concluir
```bash
pnpm verify     # typecheck + lint + node:test (vs baseline)
pnpm test:dom   # vitest jsdom
```
Reportar números vs. baseline. **Não commitar** (a usuária commita após revisar).
