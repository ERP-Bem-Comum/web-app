---
name: codex-config-maintenance
description: Mantém a camada Codex do repositório alinhada à doc oficial. Use para evoluir AGENTS.md, .codex/config.toml, subagents, skills e dependências MCP.
---

# codex-config-maintenance

Use quando:
- a tarefa for sobre Codex CLI, AGENTS.md, MCP, skills, subagents ou `config.toml`
- o usuário quiser revisar ou expandir a camada de automação do próprio repositório

Não use quando:
- a tarefa for implementar funcionalidade do produto
- a tarefa puder ser resolvida só com mudança de código do frontend

## Workflow

1. Consulte a documentação oficial da OpenAI antes de editar a configuração.
2. Trate `AGENTS.md` como guia persistente do repo e mantenha-o prático.
3. Use `.codex/config.toml` para defaults de projeto.
4. Use `.codex/agents/*.toml` para subagents especializados.
5. Use `.agents/skills/*` para workflows repetíveis.
6. Se uma skill depender de MCP, declare a dependência em `agents/openai.yaml`.
7. Prefira ajustes pequenos e auditáveis, não reestruturações amplas sem necessidade.

## Entrega esperada

- resumo do que mudou na camada Codex
- links ou referências exatas da doc oficial usada
- próximos passos recomendados para o time usar a configuração
