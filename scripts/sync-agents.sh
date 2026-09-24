#!/bin/bash
# Sync agent skills across AI coding tools.
#
# .claude/skills/ is the single source of truth. This script mirrors it to the
# skill discovery directories of other tools (formats are identical, only the
# folder differs):
#   - .agents/skills/    Codex (developers.openai.com/codex/skills)
#   - .opencode/skills/  OpenCode
#   - .zcode/skills/     ZCode
#
# Usage:
#   scripts/sync-agents.sh           # mirror source -> all targets
#   scripts/sync-agents.sh --check   # exit 1 if any target drifted (CI / manual)
#
# Claude Code users: this runs automatically via the PostToolUse hook on
# .claude/skills/** edits — you normally never need to run it by hand.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SOURCE=".claude/skills"
TARGETS=(.agents/skills .opencode/skills .zcode/skills)

cd "$ROOT"

if [[ ! -d "$SOURCE" ]]; then
  echo "❌ source directory $SOURCE not found (run from repo root)" >&2
  exit 1
fi

# --- 1. Frontmatter validation: every SKILL.md needs name + description ---
errors=0
for skill_dir in "$SOURCE"/*/; do
  name="$(basename "$skill_dir")"
  f="$skill_dir/SKILL.md"
  if [[ ! -f "$f" ]]; then
    echo "❌ skill '$name': SKILL.md missing"
    errors=$((errors + 1))
    continue
  fi
  # frontmatter is the leading YAML block; a head scan is sufficient in practice
  head -20 "$f" | grep -q '^name:' || { echo "❌ skill '$name': frontmatter 'name' missing"; errors=$((errors + 1)); }
  head -20 "$f" | grep -q '^description:' || { echo "❌ skill '$name': frontmatter 'description' missing"; errors=$((errors + 1)); }
done
if [[ $errors -gt 0 ]]; then
  echo "❌ frontmatter validation failed ($errors error(s)); fix before syncing" >&2
  exit 1
fi

# --- 2. Drift check mode ---
if [[ "${1:-}" == "--check" ]]; then
  drift=0
  for target in "${TARGETS[@]}"; do
    if ! diff -rq "$SOURCE" "$target" >/dev/null 2>&1; then
      echo "❌ drift: $target differs from $SOURCE (run: scripts/sync-agents.sh)"
      drift=1
    fi
  done
  if [[ $drift -eq 0 ]]; then
    echo "✅ all skill mirrors in sync with $SOURCE"
  fi
  exit $drift
fi

# --- 3. Mirror to all targets ---
for target in "${TARGETS[@]}"; do
  mkdir -p "$target"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$SOURCE/" "$target/"
  else
    # fallback for environments without rsync
    rm -rf "$target"
    mkdir -p "$target"
    cp -R "$SOURCE/." "$target/"
  fi
  echo "✅ synced $SOURCE -> $target"
done

echo "✅ $(ls -1 "$SOURCE" | wc -l | tr -d ' ') skills distributed to ${#TARGETS[@]} tool directories"
