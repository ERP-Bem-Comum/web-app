# 06 — Estados & Padrões Transversais

> Comportamentos que aparecem em várias telas. Padronizá-los garante consistência
> e cobre os cenários de borda dos BDDs.

---

## 1. Estado vazio (`mol.empty-state`)

Duas situações distintas — **não confundir**:

| Situação | Mensagem | Quando |
|----------|----------|--------|
| **Sem resultados** | "Nenhum resultado encontrado" | Busca/filtro não encontrou nada, mas existem dados |
| **Sem dados** | "Não existem [entidade] cadastrados" | A coleção está realmente vazia |

**Regra crítica (BDD):** nunca renderizar uma **tabela vazia** sem mensagem.
> `bdd_colaboradores.md`: "eu não devo ver uma tabela vazia / devo ver uma mensagem clara".

Aparece em: painéis de Estados/Municípios, tabelas de Fornecedores (filtro restritivo), Colaboradores (sem cadastro).

---

## 2. Estado de carregamento (`atom.spinner`)

- Exibir indicador enquanto os dados não chegam.
- **Regra crítica (BDD):** se o serviço estiver lento ou indisponível, **manter o loading na tela** (não quebrar, não exibir tabela falsa).
> `bdd_colaboradores.md`: "o sistema deve manter o indicador de carregamento (loading)".
- ⚠️ Recomendação de UX (não está no BDD, mas sugerido): após um timeout, oferecer mensagem de erro com opção de tentar novamente, para o usuário não ficar preso no loading indefinidamente. Validar com o time.

---

## 3. Estado de erro / falha de comunicação

- Mensagem clara, sem jargão técnico.
- Não expor dados parciais ou inconsistentes.
- (Recomendado) botão "Tentar novamente".

---

## 4. Permissão negada (`org.access-denied`)

- Vale tanto para **acesso via menu** quanto **acesso direto por URL** — os dois devem bloquear igualmente.
- Não renderizar nenhum dado do módulo.
- Mensagem clara sobre falta de permissão **+ orientação** (procurar quem libera acesso / próximos passos).
> `bdd_colaboradores.md`: cenários de permissão `collaborator:read`.

**Padrão de permissão:** cada módulo declara a permissão exigida; o guard de rota e o menu consultam a mesma fonte.

---

## 5. Confirmação de ação destrutiva (`org.confirm-dialog`)

Sempre que uma ação for **destrutiva ou perder dados não salvos**, interceptar com diálogo.

| Gatilho | Alerta | Ação segura | Ação destrutiva |
|---------|--------|-------------|-----------------|
| Remover estado/município | "Existem orçamentos criados…" | "Descartar alterações" (mantém) | "Sim, salvar alterações" (remove) |
| Cancelar cadastro com dados | "Deseja descartar as alterações?" | "Cancelar" (continua editando) | Confirmar descarte (sai sem salvar) |

> ⚠️ Atenção à semântica invertida em Estados: no BDD, **"Sim, salvar alterações"** é a opção que **efetiva a remoção** e **"Descartar alterações"** é a que **cancela a remoção**. Implementar exatamente como descrito em `bdd_estado.md` para não inverter o comportamento.

**Sucesso da ação:** após remover com sucesso → `org.toast` "Estado removido com sucesso!" e o item volta a ficar disponível na lista geral.

---

## 6. Feedback de sucesso (`org.toast`)

- Confirmar visualmente operações concluídas (remoção, salvamento).
- Curto, auto-dispensável, `aria-live`.
> `bdd_estado.md`: "Estado removido com sucesso!".

---

## 7. Busca independente

- Em telas com múltiplas listas (Estados, Municípios), **cada lista tem busca própria** e independente.
- Filtrar uma não afeta a outra.
> `bdd_estado.md`: "ambas as listas devem possuir campos de busca independentes".

---

## 8. Paginação

- Padrão: **10 itens por página** (regra BDD), com seletor de tamanho de página.
- Exibir range atual ("1 - 41") e navegação anterior/próximo.
> `bdd_colaboradores.md` e `bdd_financiadores.md`.

---

## 9. Modo somente-leitura → edição

- Telas de detalhe abrem em **readonly** (campos bloqueados em cinza).
- Botão "Editar" habilita a edição (transição `view` → `edit` em `org.detail-form`).
- "Voltar" retorna à listagem.

---

## 10. Estado "Adicionado" (bloqueio idempotente)

- Na transfer list, um item já adicionado aparece como **"Adicionado"** na lista geral, sem botão "+", impedindo adição duplicada.
> `bdd_estado.md` / `bdd_cidades.md`.

---

## Matriz de estados por organismo (referência rápida)

| Organismo | default | loading | empty | no-results | error | denied |
|-----------|:------:|:------:|:----:|:---------:|:----:|:-----:|
| `org.data-table` | ✅ | ✅ | ✅ | ✅ | ✅ | (via guard) |
| `org.transfer-panel` | ✅ | ✅ | ✅ | ✅ | ⚠️ | — |
| `org.detail-form` | ✅ (view) | ✅ | — | — | ✅ | (via guard) |
| Módulo Colaboradores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

✅ obrigatório · ⚠️ recomendado a confirmar · — não se aplica
