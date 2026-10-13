#!/bin/bash
# usage: run_one.sh <name> [promptfile]
NAME="$1"
PF="${2:-/Users/elchanan/Desktop/projects/nodal-electronics/art/prompts/$NAME.txt}"
RAW=/Users/elchanan/Desktop/projects/nodal-electronics/art/raw
GEN=$HOME/.codex/generated_images
MARK=$(mktemp "${TMPDIR:-/tmp}/mark.XXXXXX")
PROMPT="Use your built-in image generation tool (never draw with code, never write HTML/SVG). $(cat "$PF") Save the PNG exactly as $NAME.png in the current directory."
codex exec --skip-git-repo-check -s workspace-write -c "sandbox_workspace_write.writable_roots=[\"$RAW\"]" -C "$RAW" "$PROMPT" < /dev/null > "$RAW/$NAME.log" 2>&1
if [ ! -f "$RAW/$NAME.png" ]; then
  NEW=$(find "$GEN" -name 'exec-*.png' -newer "$MARK" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
  if [ -n "$NEW" ]; then cp "$NEW" "$RAW/$NAME.png"; echo "$NAME: copied fallback $NEW"; else echo "$NAME: NO IMAGE"; fi
else
  echo "$NAME: ok"
fi
rm -f "$MARK"
