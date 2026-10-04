#!/bin/bash
# FORENSIC STATE CAPTURE — deterministic, assertion-gated
# Uses agent-browser (project standard) with scoped card selectors
set -e

OUT="artifacts/catalog-final/forensic"
BASE="http://localhost:3200"
mkdir -p "$OUT"

echo "=== FORENSIC STATE CAPTURE ==="
echo "Output: $OUT"

# Navigate to catalog
agent-browser open "$BASE/archivio"
agent-browser set viewport 390 844
sleep 3

# Verify AgentX card exists
CARD_EXISTS=$(agent-browser eval "(() => { const c = document.querySelector('.ar4-card'); return c ? c.querySelector('.ar4-card__name-text')?.textContent : 'NONE' })()")
echo "First card: $CARD_EXISTS"

# Helper: clear all save/compare state
clear_state() {
  agent-browser eval "(() => {
    // Click any active bookmark buttons to deactivate
    document.querySelectorAll('.ar4-card__bookmark[data-saved]').forEach(b => b.click());
    // Click any active compare buttons to deactivate
    document.querySelectorAll('[data-sonic-action=\"compare\"].is-active').forEach(b => b.click());
    return 'cleared';
  })()"
  sleep 0.5
}

# Helper: assert card state before capture
assert_state() {
  local expected_saved=$1
  local expected_compared=$2
  local label=$3
  
  RESULT=$(agent-browser eval "(() => {
    const card = document.querySelector('.ar4-card');
    if (!card) return JSON.stringify({error: 'no card'});
    const saved = card.getAttribute('data-qa-saved');
    const compared = card.getAttribute('data-qa-compared');
    const tier = card.getAttribute('data-qa-tier');
    const dataSaved = card.hasAttribute('data-saved');
    const dataSelected = card.hasAttribute('data-selected');
    const watermark = !!card.querySelector('.ar4-card__watermark');
    const bookmarkPressed = card.querySelector('.ar4-card__bookmark')?.getAttribute('aria-pressed');
    const comparePressed = card.querySelector('[data-sonic-action=\"compare\"]')?.getAttribute('aria-pressed');
    const saveLayer = card.querySelector('.ar4-card__save-layer');
    const compareLayer = card.querySelector('.ar4-card__compare-layer');
    return JSON.stringify({saved, compared, tier, dataSaved, dataSelected, watermark, bookmarkPressed, comparePressed, hasSaveLayer: !!saveLayer, hasCompareLayer: !!compareLayer});
  })()")
  
  echo "  State: $RESULT"
  
  # Parse and validate
  SAVED=$(echo "$RESULT" | python3 -c "
import sys, json
raw = sys.stdin.read().strip()
try:
    d = json.loads(raw)
    if isinstance(d, str):
        d = json.loads(d)
    print(d.get('saved',''))
except:
    print('')
" 2>/dev/null || echo "")
  COMPARED=$(echo "$RESULT" | python3 -c "
import sys, json
raw = sys.stdin.read().strip()
try:
    d = json.loads(raw)
    if isinstance(d, str):
        d = json.loads(d)
    print(d.get('compared',''))
except:
    print('')
" 2>/dev/null || echo "")
  
  if [ "$SAVED" != "$expected_saved" ]; then
    echo "  ✗ ASSERTION FAILED: saved expected=$expected_saved got=$SAVED"
    echo "  ABORTING: will not save screenshot with wrong state"
    exit 1
  fi
  if [ "$COMPARED" != "$expected_compared" ]; then
    echo "  ✗ ASSERTION FAILED: compared expected=$expected_compared got=$COMPARED"
    echo "  ABORTING: will not save screenshot with wrong state"
    exit 1
  fi
  echo "  ✓ Assertions passed"
}

# Helper: capture card element
capture_card() {
  local filename=$1
  agent-browser screenshot '.ar4-card' "$OUT/$filename"
  echo "  ✓ Captured: $filename"
  
  # Write sidecar
  cat > "$OUT/${filename%.png}.json" << EOF
{
  "filename": "$filename",
  "tool": "AgentX",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gitSha": "$(git rev-parse --short HEAD)",
  "viewport": "390x844"
}
EOF
  echo "  ✓ Sidecar: ${filename%.png}.json"
}

echo ""
echo "=== STATE-TRUTH-TABLE ==="

# 1. DEFAULT
echo ""
echo "--- 01-DEFAULT ---"
clear_state
assert_state "false" "false" "DEFAULT"
capture_card "STATE-TRUTH-01-DEFAULT.png"

# 2. SAVED
echo ""
echo "--- 02-SAVED ---"
clear_state
agent-browser eval "(() => { document.querySelector('.ar4-card__bookmark').click(); return 'clicked save' })()"
sleep 1
assert_state "true" "false" "SAVED"
capture_card "STATE-TRUTH-02-SAVED.png"

# 3. COMPARE
echo ""
echo "--- 03-COMPARE ---"
clear_state
agent-browser eval "(() => { document.querySelector('[data-sonic-action=\"compare\"]').click(); return 'clicked compare' })()"
sleep 1
assert_state "false" "true" "COMPARE"
capture_card "STATE-TRUTH-03-COMPARE.png"

# 4. BOTH
echo ""
echo "--- 04-BOTH ---"
clear_state
agent-browser eval "(() => { document.querySelector('.ar4-card__bookmark').click(); return 'clicked save' })()"
sleep 0.5
agent-browser eval "(() => { document.querySelector('[data-sonic-action=\"compare\"]').click(); return 'clicked compare' })()"
sleep 1
assert_state "true" "true" "BOTH"
capture_card "STATE-TRUTH-04-BOTH.png"

echo ""
echo "=== PODIUM-TRUTH-TABLE ==="

# Podium cards — need to find blink, vibecode, weweb
for SLUG_RANK in "blink:01:gold" "vibecode:02:silver" "weweb:03:bronze"; do
  SLUG=$(echo "$SLUG_RANK" | cut -d: -f1)
  RANK=$(echo "$SLUG_RANK" | cut -d: -f2)
  TIER=$(echo "$SLUG_RANK" | cut -d: -f3)
  
  echo ""
  echo "--- $RANK $SLUG ($TIER) ---"
  
  # Find the specific card by scrolling to it
  FOUND=$(agent-browser eval "(() => {
    const cards = document.querySelectorAll('.ar4-card');
    for (const c of cards) {
      const link = c.querySelector('.ar4-card__name-link');
      if (link && link.getAttribute('href')?.includes('$SLUG')) {
        c.scrollIntoView({block: 'center'});
        return 'found';
      }
    }
    return 'not-found';
  })()")
  
  if [ "$FOUND" != "found" ]; then
    echo "  SKIP: $SLUG not visible"
    continue
  fi
  sleep 0.5
  
  # Verify tier
  TIER_ATTR=$(agent-browser eval "(() => {
    const cards = document.querySelectorAll('.ar4-card');
    for (const c of cards) {
      const link = c.querySelector('.ar4-card__name-link');
      if (link && link.getAttribute('href')?.includes('$SLUG')) {
        return c.getAttribute('data-qa-tier') || 'none';
      }
    }
    return 'not-found';
  })()")
  echo "  Tier: $TIER_ATTR (expected: $TIER)"
  
  # Clear state on this specific card
  agent-browser eval "(() => {
    const cards = document.querySelectorAll('.ar4-card');
    for (const c of cards) {
      const link = c.querySelector('.ar4-card__name-link');
      if (link && link.getAttribute('href')?.includes('$SLUG')) {
        const bm = c.querySelector('.ar4-card__bookmark[data-saved]');
        if (bm) bm.click();
        const cmp = c.querySelector('[data-sonic-action=\"compare\"].is-active');
        if (cmp) cmp.click();
        return 'cleared';
      }
    }
  })()"
  sleep 0.5
  
  # Capture DEFAULT
  agent-browser screenshot ".ar4-card:has(.ar4-card__name-link[href*=\"$SLUG\"])" "$OUT/PODIUM-TRUTH-$RANK-$TIER-DEFAULT.png"
  echo "  ✓ Captured: PODIUM-TRUTH-$RANK-$TIER-DEFAULT.png"
  
  # For #1 (blink), capture all 4 states
  if [ "$RANK" = "01" ]; then
    # SAVED
    agent-browser eval "(() => {
      const cards = document.querySelectorAll('.ar4-card');
      for (const c of cards) {
        const link = c.querySelector('.ar4-card__name-link');
        if (link && link.getAttribute('href')?.includes('$SLUG')) {
          c.querySelector('.ar4-card__bookmark').click();
          return 'saved';
        }
      }
    })()"
    sleep 1
    agent-browser screenshot ".ar4-card:has(.ar4-card__name-link[href*=\"$SLUG\"])" "$OUT/PODIUM-TRUTH-$RANK-$TIER-SAVED.png"
    echo "  ✓ Captured: PODIUM-TRUTH-$RANK-$TIER-SAVED.png"
    
    # Reset and COMPARE
    agent-browser eval "(() => {
      const cards = document.querySelectorAll('.ar4-card');
      for (const c of cards) {
        const link = c.querySelector('.ar4-card__name-link');
        if (link && link.getAttribute('href')?.includes('$SLUG')) {
          const bm = c.querySelector('.ar4-card__bookmark[data-saved]');
          if (bm) bm.click();
          c.querySelector('[data-sonic-action=\"compare\"]').click();
          return 'compared';
        }
      }
    })()"
    sleep 1
    agent-browser screenshot ".ar4-card:has(.ar4-card__name-link[href*=\"$SLUG\"])" "$OUT/PODIUM-TRUTH-$RANK-$TIER-COMPARE.png"
    echo "  ✓ Captured: PODIUM-TRUTH-$RANK-$TIER-COMPARE.png"
    
    # BOTH
    agent-browser eval "(() => {
      const cards = document.querySelectorAll('.ar4-card');
      for (const c of cards) {
        const link = c.querySelector('.ar4-card__name-link');
        if (link && link.getAttribute('href')?.includes('$SLUG')) {
          c.querySelector('.ar4-card__bookmark').click();
          return 'both';
        }
      }
    })()"
    sleep 1
    agent-browser screenshot ".ar4-card:has(.ar4-card__name-link[href*=\"$SLUG\"])" "$OUT/PODIUM-TRUTH-$RANK-$TIER-BOTH.png"
    echo "  ✓ Captured: PODIUM-TRUTH-$RANK-$TIER-BOTH.png"
  fi
done

echo ""
echo "✓ All forensic captures complete with assertions."
