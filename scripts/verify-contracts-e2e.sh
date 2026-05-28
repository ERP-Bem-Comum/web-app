#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# verify-contracts-e2e.sh
# E2E verification for Contracts module (Playwright)
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo "  Contracts Module — E2E Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if ! command -v npx >/dev/null 2>&1; then
  echo -e "${RED}✗ FAIL${NC}: npx not found"
  exit 1
fi

if [ ! -f "playwright.config.ts" ] && [ ! -f "playwright.config.js" ]; then
  echo -e "${YELLOW}⚠ WARN${NC}: Playwright config not found — skipping E2E"
  exit 0
fi

echo -e "${BLUE}ℹ INFO${NC}: Running Playwright E2E tests..."
if npx playwright test tests/e2e/ --reporter=line 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}: E2E tests passed"
  exit 0
else
  echo -e "${RED}✗ FAIL${NC}: E2E tests failed"
  exit 1
fi
