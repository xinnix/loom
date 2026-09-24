#!/bin/bash
# Hook: Sync Agent Skills
# When a skill under .claude/skills/ is edited, mirror it to the other agent
# tool directories (.agents/.opencode/.zcode) so Codex/OpenCode/ZCode stay current.

if [[ "$FILE_PATH" == *".claude/skills/"* ]]; then
  echo "🔄 Skill change detected, syncing to Codex/OpenCode/ZCode mirrors..."
  if bash "$(git rev-parse --show-toplevel)/scripts/sync-agents.sh" >/dev/null 2>&1; then
    echo "✅ Skill mirrors synced"
  else
    echo "⚠️ Skill sync failed (non-blocking) — run: scripts/sync-agents.sh"
  fi
fi

exit 0
