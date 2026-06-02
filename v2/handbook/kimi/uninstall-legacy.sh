#!/usr/bin/env bash
# uninstall-legacy.sh — remove o Kimi LEGADO (kimi-cli, versão Python) de um Mac.
#
# O que faz: desinstala o pacote kimi-cli pelo gerenciador que o instalou (uv / pipx /
# pip / brew) e, opcionalmente, remove os dados legados em ~/.kimi/ (config, sessões,
# credenciais, logs, hooks).
#
# O que NUNCA faz: tocar no kimi-code NOVO (Node) nem em ~/.kimi-code/. São coisas
# diferentes — ~/.kimi/ é o legado; ~/.kimi-code/ é a versão atual e fica intacta.
#
# Uso:
#   ./uninstall-legacy.sh                 # interativo: pergunta antes de cada passo
#   ./uninstall-legacy.sh --dry-run       # só mostra o que faria (não remove nada)
#   ./uninstall-legacy.sh --backup        # faz um .tgz de ~/.kimi/ antes de remover
#   ./uninstall-legacy.sh --purge-data    # também remove ~/.kimi/ (dados/credenciais)
#   ./uninstall-legacy.sh --yes           # não pergunta (assume "sim"); use com cuidado
#   ./uninstall-legacy.sh --help
#
# Dica: se ainda NÃO migrou o legado para o kimi-code, rode `kimi migrate` ANTES de apagar
# ~/.kimi/ (ele lê de lá). Ou use --backup para guardar um arquivo antes.

set -uo pipefail

VERSION="1.0.0"
DRY_RUN=0; PURGE_DATA=0; BACKUP=0; ASSUME_YES=0

# ~/.kimi pode estar noutro lugar se o legado usava KIMI_SHARE_DIR.
LEGACY_DATA="${KIMI_SHARE_DIR:-$HOME/.kimi}"
NEW_DATA="$HOME/.kimi-code"        # PROTEGIDO — versão nova (Node). Nunca remover.

# Cores (respeita NO_COLOR)
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  B=$'\033[1m'; DIM=$'\033[2m'; R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; C=$'\033[36m'; Z=$'\033[0m'
else
  B=""; DIM=""; R=""; G=""; Y=""; C=""; Z=""
fi

info() { printf '%s\n' "$*"; }
ok()   { printf '%s✓%s %s\n' "$G" "$Z" "$*"; }
warn() { printf '%s!%s %s\n' "$Y" "$Z" "$*"; }
err()  { printf '%s✗%s %s\n' "$R" "$Z" "$*" >&2; }
head() { printf '\n%s== %s ==%s\n' "$B" "$*" "$Z"; }

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; }

# Executa respeitando --dry-run. Recebe o comando como argumentos (sem pipes).
run() {
  if [ "$DRY_RUN" = "1" ]; then printf '  %s[dry-run]%s %s\n' "$DIM" "$Z" "$*"; return 0; fi
  printf '  + %s\n' "$*"; "$@"
}

# Pergunta sim/não. --yes => sim. Sem TTY e sem --yes => não (seguro).
confirm() {
  [ "$ASSUME_YES" = "1" ] && return 0
  local ans=""
  if [ -e /dev/tty ]; then read -r -p "  $* [s/N] " ans </dev/tty 2>/dev/null || ans=""; fi
  case "$(printf '%s' "$ans" | tr '[:upper:]' '[:lower:]')" in s|sim|y|yes) return 0;; *) return 1;; esac
}

# Trava de segurança: nada de remover ~/.kimi-code, $HOME, "/", vazio.
is_unsafe_target() {
  local p="$1"
  [ -z "$p" ] && return 0
  [ "$p" = "/" ] && return 0
  [ "$p" = "$HOME" ] && return 0
  case "$p/" in "$NEW_DATA"/*|"$NEW_DATA/") return 0;; esac
  return 1
}

# --- parse de flags ---
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run|-n) DRY_RUN=1 ;;
    --purge-data) PURGE_DATA=1 ;;
    --backup)     BACKUP=1 ;;
    --yes|-y)     ASSUME_YES=1 ;;
    --help|-h)    usage; exit 0 ;;
    *) err "opção desconhecida: $1"; usage; exit 2 ;;
  esac
  shift
done

printf '%sDesinstalador do Kimi legado (kimi-cli, Python) — v%s%s\n' "$B" "$VERSION" "$Z"
[ "$DRY_RUN" = "1" ] && warn "modo --dry-run: nada será alterado."

# --- inventário ---
head "Inventário"
FOUND=0

# Versão nova (protegida)
if [ -d "$NEW_DATA" ] || command -v kimi >/dev/null 2>&1; then
  info "kimi-code novo: ${C}${NEW_DATA}${Z} ${DIM}(PROTEGIDO — não será tocado)${Z}"
fi

# Pacote via uv tool
UV_HAS=0
if command -v uv >/dev/null 2>&1 && uv tool list 2>/dev/null | grep -qi 'kimi'; then
  UV_HAS=1; FOUND=1; warn "encontrado via uv tool: $(uv tool list 2>/dev/null | grep -i kimi | head -1)"
fi
# Pacote via pipx
PIPX_HAS=0
if command -v pipx >/dev/null 2>&1 && pipx list 2>/dev/null | grep -qi 'kimi'; then
  PIPX_HAS=1; FOUND=1; warn "encontrado via pipx (kimi-cli)"
fi
# Pacote via pip/pip3
PIP_BIN=""; PIP_HAS=0
for p in pip3 pip; do
  if command -v "$p" >/dev/null 2>&1 && "$p" show kimi-cli >/dev/null 2>&1; then
    PIP_BIN="$p"; PIP_HAS=1; FOUND=1
    warn "encontrado via $p: kimi-cli $("$p" show kimi-cli 2>/dev/null | awk '/^Version:/{print $2}')"
    break
  fi
done
# Pacote via Homebrew
BREW_HAS=0
if command -v brew >/dev/null 2>&1 && brew list --formula 2>/dev/null | grep -qiE '^kimi(-cli)?$'; then
  BREW_HAS=1; FOUND=1; warn "encontrado via Homebrew (formula kimi)"
fi
# Binários "kimi" fora da versão nova (instalação manual/legada)
STRAY=""
if command -v kimi >/dev/null 2>&1; then
  while IFS= read -r line; do
    bin="${line##* is }"                 # 'type -a' imprime: "kimi is /caminho"
    [ -x "$bin" ] || continue
    case "$bin/" in "$NEW_DATA"/*) continue;; esac   # ignora o binário novo
    STRAY="$STRAY $bin"
  done < <(type -a kimi 2>/dev/null | sort -u)
fi
[ -n "$STRAY" ] && { FOUND=1; warn "binário(s) 'kimi' fora de ~/.kimi-code:$STRAY"; }

# Dados legados
if [ -e "$LEGACY_DATA" ]; then
  FOUND=1; warn "dados legados: ${C}${LEGACY_DATA}${Z} ($(du -sh "$LEGACY_DATA" 2>/dev/null | cut -f1))"
else
  info "dados legados: ${DIM}${LEGACY_DATA} não existe${Z}"
fi

if [ "$FOUND" = "0" ]; then
  head "Resultado"
  ok "Nada do Kimi legado encontrado. ${DIM}(O kimi-code novo, se existir, permanece intacto.)${Z}"
  exit 0
fi

# Aviso de migração (dados legados ainda presentes)
if [ -e "$LEGACY_DATA" ]; then
  head "Atenção aos dados"
  warn "~/.kimi contém config, sessões e CREDENCIAIS do legado."
  info "Se ainda não migrou para o kimi-code, rode ${C}kimi migrate${Z} antes de apagar (ele lê de ~/.kimi)."
  info "Ou guarde um backup com ${C}--backup${Z}."
fi

# --- desinstalação do pacote ---
head "Remover o pacote kimi-cli"
if [ "$UV_HAS" = "1" ] && confirm "Desinstalar via 'uv tool uninstall kimi-cli'?"; then
  run uv tool uninstall kimi-cli && ok "uv: removido"
fi
if [ "$PIPX_HAS" = "1" ] && confirm "Desinstalar via 'pipx uninstall kimi-cli'?"; then
  run pipx uninstall kimi-cli && ok "pipx: removido"
fi
if [ "$PIP_HAS" = "1" ] && confirm "Desinstalar via '$PIP_BIN uninstall kimi-cli'?"; then
  run "$PIP_BIN" uninstall -y kimi-cli && ok "$PIP_BIN: removido"
fi
if [ "$BREW_HAS" = "1" ] && confirm "Desinstalar via 'brew uninstall kimi'?"; then
  run brew uninstall kimi 2>/dev/null || run brew uninstall kimi-cli
fi
if [ -n "$STRAY" ]; then
  for bin in $STRAY; do
    if is_unsafe_target "$bin"; then warn "ignorando alvo protegido: $bin"; continue; fi
    if confirm "Remover binário avulso $bin?"; then run rm -f "$bin" && ok "removido $bin"; fi
  done
fi

# --- dados legados ---
if [ -e "$LEGACY_DATA" ]; then
  head "Dados legados (~/.kimi)"
  if [ "$BACKUP" = "1" ] || { [ "$PURGE_DATA" = "0" ] && confirm "Fazer backup .tgz de ~/.kimi antes?"; }; then
    TS="$(date +%Y%m%d-%H%M%S)"; BK="$HOME/kimi-legacy-backup-$TS.tgz"
    run tar -czf "$BK" -C "$(dirname "$LEGACY_DATA")" "$(basename "$LEGACY_DATA")" && ok "backup: $BK"
  fi
  DO_PURGE=0
  if [ "$PURGE_DATA" = "1" ]; then DO_PURGE=1
  elif confirm "Remover DEFINITIVAMENTE $LEGACY_DATA (dados + credenciais)?"; then DO_PURGE=1; fi
  if [ "$DO_PURGE" = "1" ]; then
    if is_unsafe_target "$LEGACY_DATA"; then
      err "RECUSADO: $LEGACY_DATA é um alvo inseguro/protegido. Nada removido."
    else
      run rm -rf "$LEGACY_DATA" && ok "removido $LEGACY_DATA"
    fi
  else
    info "${DIM}mantido: $LEGACY_DATA${Z}"
  fi
fi

# --- referências em arquivos de shell (só reporta; não edita p/ não tocar segredos) ---
head "Referências nos arquivos de shell (revisar à mão)"
RC_HITS=0
for rc in "$HOME/.zshrc" "$HOME/.zprofile" "$HOME/.zshenv" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile"; do
  [ -f "$rc" ] || continue
  ln="$(grep -niE 'kimi' "$rc" 2>/dev/null | grep -viE 'kimi-code' | cut -d: -f1 | tr '\n' ' ')"
  [ -n "$ln" ] && { RC_HITS=1; info "  • $rc — linhas: $ln"; }
done
[ "$RC_HITS" = "1" ] && warn "Revise essas linhas (ex.: PATH, KIMI_SHARE_DIR, aliases). Não editei p/ evitar mexer em segredos." || info "  ${DIM}nenhuma referência a 'kimi' (legado) encontrada${Z}"

# --- resumo ---
head "Resumo"
if command -v kimi >/dev/null 2>&1; then
  info "kimi atual no PATH: ${C}$(command -v kimi)${Z}  ${DIM}($(kimi --version 2>/dev/null | head -1))${Z}"
  case "$(command -v kimi)/" in "$NEW_DATA"/*) ok "é o kimi-code novo (esperado).";; *) warn "não é o kimi-code novo — confira manualmente.";; esac
else
  ok "nenhum 'kimi' no PATH agora."
fi
[ "$DRY_RUN" = "1" ] && warn "Era --dry-run: nada foi alterado de fato."
ok "Concluído."
