#!/usr/bin/env bash
# Helpers compartilhados pelos hooks deste projeto.
# AGNÓSTICO de harness: os mesmos scripts servem tanto ao Claude Code quanto ao
# Kimi Code (Node) — ver handbook/kimi/README.md §"Guard-rails".
# Carregue com:  . "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

# Extrai UM campo de .tool_input do JSON do hook (helper interno).
# Usa jq quando disponível (mais robusto); cai pro node se não houver jq.
_hook_one_field() {
  json="$1"; field="$2"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$json" | jq -r --arg f "$field" '.tool_input[$f] // ""'
  else
    printf '%s' "$json" | FIELD="$field" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String((JSON.parse(s).tool_input||{})[process.env.FIELD]||""))}catch{}})'
  fi
}

# Extrai o PRIMEIRO campo não-vazio de .tool_input dentre os nomes passados.
#   $1     = JSON completo do hook (lido via stdin e passado adiante)
#   $2..   = nomes de campo candidatos, em ordem de preferência
# Por que aceitar vários: o payload do hook difere por harness — o Claude Code usa
# `file_path` em Write/Edit; o Kimi Code (Node) usa `path` (ver
# handbook/kimi/docs-offline/reference/tools.md). `command` (Bash) é igual nos dois.
# Chame, p.ex., como:  hook_tool_input_field "$INPUT" file_path path
hook_tool_input_field() {
  json="$1"; shift
  for field in "$@"; do
    val=$(_hook_one_field "$json" "$field")
    if [ -n "$val" ]; then printf '%s' "$val"; return 0; fi
  done
  printf ''
}
