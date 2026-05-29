#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# verify-contracts-static.sh
# Hard verification for Contracts module baseline
# Fails if any forbidden pattern is found
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ERRORS=$((ERRORS + 1))
}

pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
}

warn() {
  echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

echo "═══════════════════════════════════════════════════════════════"
echo "  Contracts Module — Static Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── 1. ContractBankInfoModal must not exist ──────────────────
if grep -rI "ContractBankInfoModal" src/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
  fail "ContractBankInfoModal found in src/"
else
  pass "ContractBankInfoModal not found in src/"
fi

# ─── 2. editContractPaymentInfo must not exist ────────────────
if grep -rI "editContractPaymentInfo" src/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
  fail "editContractPaymentInfo found in src/"
else
  pass "editContractPaymentInfo not found in src/"
fi

# ─── 3. No bank/PX edit flow inside src/features/contracts ────
PATTERNS=(
  "edit.*bancaryInfo"
  "edit.*pixInfo"
  "update.*bancaryInfo"
  "update.*pixInfo"
  "bancaryInfo.*edit"
  "pixInfo.*edit"
)
BANK_EDIT_FOUND=0
for pat in "${PATTERNS[@]}"; do
  if grep -ri "$pat" src/features/contracts/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    BANK_EDIT_FOUND=1
    grep -ri "$pat" src/features/contracts/ --include="*.ts" --include="*.tsx" | head -5
  fi
done
if [ "$BANK_EDIT_FOUND" -eq 1 ]; then
  fail "Bank/PIX edit patterns found in src/features/contracts/"
else
  pass "No bank/PIX edit patterns in src/features/contracts/"
fi

# ─── 4. No cookie: session-token in server-to-server API calls ─
if grep -rI "cookie: \`session-token" src/server/ --include="*.ts" >/dev/null 2>&1; then
  fail "cookie: session-token found in src/server/ (should be authorization: Bearer)"
  grep -rI "cookie: \`session-token" src/server/ --include="*.ts"
else
  pass "No cookie: session-token in src/server/ (using authorization: Bearer)"
fi

# ─── 5. No generated artifacts ADDED/MODIFIED in git ──────────
# Deletions (D) are fine — we're removing tracked generated files
GENERATED_PATTERNS=(".output/" ".tanstack/tmp/" "playwright-report/" "test-results/" ".yarn/install-state.gz")
ARTIFACTS_FOUND=0
for pat in "${GENERATED_PATTERNS[@]}"; do
  # Check diff for additions/modifications (not deletions)
  if git diff --diff-filter=AM --name-only HEAD 2>/dev/null | grep -q "$pat"; then
    ARTIFACTS_FOUND=1
    fail "Generated artifact '$pat' added/modified in git diff"
  fi
  # Check status for additions/modifications (not deletions)
  if git status --short 2>/dev/null | grep -E "^\s*[AM].*$pat" >/dev/null 2>&1; then
    ARTIFACTS_FOUND=1
    fail "Generated artifact '$pat' added/modified in git status"
  fi
done
if [ "$ARTIFACTS_FOUND" -eq 0 ]; then
  pass "No generated artifacts added/modified in git diff/status"
fi

# ─── 6. Vitest excludes Playwright specs ──────────────────────
if grep -q "tests/e2e" vitest.config.ts 2>/dev/null; then
  pass "Vitest config excludes tests/e2e/"
else
  fail "Vitest config does not exclude tests/e2e/"
fi

# ─── 7. .gitignore covers generated artifacts ─────────────────
IGNORE_PATTERNS=(".output/" ".tanstack/" "playwright-report/" "test-results/" ".yarn/install-state.gz")
IGNORE_OK=1
for pat in "${IGNORE_PATTERNS[@]}"; do
  if ! grep -q "$pat" .gitignore 2>/dev/null; then
    IGNORE_OK=0
    fail ".gitignore missing: $pat"
  fi
done
if [ "$IGNORE_OK" -eq 1 ]; then
  pass ".gitignore covers all generated artifacts"
fi

# ─── 8. Mock API data preserved ───────────────────────────────
if [ -f "mock-api.ts" ]; then
  pass "mock-api.ts exists ($(wc -l < mock-api.ts) lines)"
else
  fail "mock-api.ts missing"
fi

# ─── 9. GSD artifacts reflect Phase 7 cancellation ────────────
if grep -q "cancelled\|CANCELLED\|REMOVIDA\|cancelada" .planning/STATE.md 2>/dev/null; then
  pass "STATE.md reflects Phase 7 cancellation"
else
  fail "STATE.md does not reflect Phase 7 cancellation"
fi

if grep -q "CANCELADA\|cancelled\|cancelada" .planning/ROADMAP.md 2>/dev/null; then
  pass "ROADMAP.md reflects Phase 7 cancellation"
else
  fail "ROADMAP.md does not reflect Phase 7 cancellation"
fi

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED${NC} — Contracts baseline is clean"
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
else
  echo -e "${RED}✗ $ERRORS CHECK(S) FAILED${NC} — Contracts baseline has issues"
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi
