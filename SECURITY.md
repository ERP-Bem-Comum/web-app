# Política de segurança — web-app (ERP Bem Comum)

## Como reportar uma vulnerabilidade

**Não abra issue pública.** Use o reporte privado do GitHub:
**Security → Report a vulnerability** neste repositório
(<https://github.com/ERP-Bem-Comum/web-app/security/advisories/new>).

Inclua o que for possível: a rota ou tela afetada, os passos para reproduzir, o impacto esperado e a
versão (commit) em que você observou o problema. O relato fica visível só para os mantenedores.

## O que acontece depois

| Etapa                                    | Prazo-alvo                            |
| :--------------------------------------- | :------------------------------------ |
| Confirmação de recebimento               | 2 dias úteis                          |
| Triagem e severidade                     | 5 dias úteis                          |
| Correção de **crítica/alta** em produção | o quanto antes, com hotfix se preciso |

## Versões suportadas

Só a branch `main` (produção) recebe correção de segurança. `develop` é homologação.

## Travas automáticas deste repositório

As regras completas estão no ADR-0023 (`handbook/adr/`). Em resumo:

- Auditoria de dependências obrigatória em todo PR. Ela barra vulnerabilidade high/critical em
  dependência de produção e falha fechada se o registry estiver fora do ar.
- Auditoria diária da `main` e da `develop`. Se ficar vermelha, abre uma issue `seguranca` atribuída
  aos responsáveis.
- Quarentena de 1 dia e `trustPolicy: no-downgrade` no pnpm (`pnpm-workspace.yaml`), protegidas por
  teste de governança.
- Escaneamento de segredos com bloqueio no push, CodeQL e alertas do Dependabot.
- A `main` só recebe PR vindo da `develop`, de `release/*` ou de `hotfix/*`.
