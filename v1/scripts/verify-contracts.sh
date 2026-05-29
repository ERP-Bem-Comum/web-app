#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# verify-contracts.sh
# Full verification pipeline for Contracts module baseline
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ERRORS=$((ERRORS + 1))
}

pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
}

info() {
  echo -e "${BLUE}ℹ INFO${NC}: $1"
}

echo "═══════════════════════════════════════════════════════════════"
echo "  Contracts Module — Full Verification Pipeline"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── 1. Unit Tests ────────────────────────────────────────────
info "Running unit tests..."
if yarn test:run >/dev/null 2>&1; then
  pass "Unit tests passed"
else
  fail "Unit tests failed"
fi

# ─── 2. Integration Tests ─────────────────────────────────────
info "Running integration tests..."
if npx vitest run tests/integration/ --reporter=dot >/dev/null 2>&1; then
  pass "Integration tests passed"
else
  fail "Integration tests failed"
fi

# ─── 2. Build ─────────────────────────────────────────────────
info "Running build..."
if yarn build >/dev/null 2>&1; then
  pass "Build passed"
else
  fail "Build failed"
fi

# ─── 3. Static Checks ─────────────────────────────────────────
info "Running static verification..."
if bash scripts/verify-contracts-static.sh; then
  pass "Static verification passed"
else
  fail "Static verification failed"
fi

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}✓ ALL VERIFICATIONS PASSED${NC}"
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
else
  echo -e "${RED}✗ $ERRORS VERIFICATION(S) FAILED${NC}"
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
fi
