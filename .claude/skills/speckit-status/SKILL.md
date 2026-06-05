---
name: "speckit-status"
description: "Mostra VOCÊ ESTÁ AQUI no fluxo spec-kit: em que fase a feature atual está, quais artefatos existem, progresso das tasks e qual o próximo comando. Use quando estiver perdido sobre o que fazer a seguir, ao retomar o trabalho, ou para checar o andamento sem alterar nada."
argument-hint: "(opcional) caminho de uma feature específica em specs/"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "bem-comum"
  source: "local"
user-invocable: true
disable-model-invocation: false
---

## Objetivo

Dar um "você está aqui" instantâneo e **100% read-only** do fluxo spec-kit. Nunca
modifica arquivos. Serve para quem se perdeu no processo ou está retomando.

## Fluxo canônico (a régua)

```
constitution → specify → (clarify) → plan → (checklist) → tasks → (analyze) → implement
```

Os passos entre parênteses são opcionais. A feature ativa fica registrada em
`.specify/feature.json` (`feature_directory`).

## Passos

1. **Descobrir a feature ativa.** Se o usuário passou um caminho em `$ARGUMENTS`, use-o.
   Senão, leia `.specify/feature.json` e pegue `feature_directory`. Se não existir, diga
   que ainda não há feature iniciada e sugira `/speckit-specify`.

2. **Coletar o estado** (read-only). Rode este bloco a partir da raiz do repo e leia a saída:

   ```bash
   FDIR=$(node -e "try{process.stdout.write(require('./.specify/feature.json').feature_directory)}catch{process.stdout.write('')}")
   [ -n "$1" ] && FDIR="$1"
   echo "FEATURE_DIR=$FDIR"
   for f in spec.md plan.md research.md data-model.md quickstart.md tasks.md; do
     [ -f "$FDIR/$f" ] && echo "HAS $f" || echo "NO  $f"
   done
   [ -d "$FDIR/contracts" ] && echo "HAS contracts/" || echo "NO  contracts/"
   [ -d "$FDIR/checklists" ] && echo "HAS checklists/ -> $(ls "$FDIR/checklists" 2>/dev/null | tr '\n' ' ')" || echo "NO  checklists/"
   if [ -f "$FDIR/tasks.md" ]; then
     DONE=$(grep -cE '^- \[[xX]\]' "$FDIR/tasks.md")
     TODO=$(grep -cE '^- \[ \]' "$FDIR/tasks.md")
     echo "TASKS done=$DONE todo=$TODO"
   fi
   ```

3. **Determinar a fase atual** pela presença de artefatos (o primeiro que faltar é o gargalo):
   - sem `spec.md` → fase **specify**
   - tem `spec.md`, sem `plan.md` → fase **plan** (sugira `/speckit-clarify` antes se a spec tiver ambiguidades)
   - tem `plan.md`, sem `tasks.md` → fase **tasks** (opcional: `/speckit-checklist`)
   - tem `tasks.md` com tasks pendentes → fase **implement** (opcional antes: `/speckit-analyze`)
   - `tasks.md` com tudo `[X]` → fase **concluída** → sugira `pnpm verify` e revisão

4. **Renderizar o "VOCÊ ESTÁ AQUI"** marcando a régua e listando artefatos:

   ```
   Feature: 006-login-view-styling

   constitution ✓ → specify ✓ → (clarify ✓) → plan ✓ → (checklist –) → tasks ✓ → (analyze –) → IMPLEMENT ◀ você está aqui

   Artefatos:  spec ✓  plan ✓  tasks ✓ (7/12 feitas)  data-model ✓  contracts –
   Próximo:    continuar a implementação → /speckit-implement
   Atalho:     ver o que falta → abrir tasks.md e procurar linhas "- [ ]"
   ```

5. **Fechar com 1 linha de orientação** apontando o comando recomendado e, se útil,
   lembrar que `.claude/README.md` tem o mapa completo e o playbook de "a IA alucinou".

## Regras

- **NUNCA** edite arquivos — isto é só leitura/diagnóstico.
- Se faltar a estrutura `.specify/`, oriente rodar o fluxo a partir de `/speckit-specify`.
- Seja conciso: o valor é o usuário entender em 5 segundos onde está e o que fazer.
