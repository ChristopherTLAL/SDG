#!/bin/bash
# inbox-auto-status.sh — quick health check for the inbox auto job.
#
# Shows: launchd registration, last 30 log lines, lock state, pause flag,
# unprocessed queue size.

set -uo pipefail

REPO_ROOT="/Users/shijie/Code/sdg-html"
LOG_FILE="$HOME/Library/Logs/sdg-inbox-auto.log"
LOCK_FILE="/tmp/sdg-inbox-auto.lock"
PAUSE_FILE="$REPO_ROOT/.inbox-auto-paused"
PLIST="$HOME/Library/LaunchAgents/com.sdg.inbox-auto.plist"

echo "═══ SDG Inbox Auto status ═══"
echo

# ── launchctl status ──
# Note: grep -q + pipefail can mis-fire here; use a captured approach instead.
echo "▸ launchd registration:"
LAUNCHCTL_LINE=$(launchctl list 2>/dev/null | grep com.sdg.inbox-auto || true)
if [[ -n "$LAUNCHCTL_LINE" ]]; then
  echo "$LAUNCHCTL_LINE" | sed 's/^/    /'
  echo "    plist: $PLIST"
else
  echo "    NOT LOADED. Enable with:"
  echo "      launchctl load $PLIST"
fi
echo

# ── Pause flag ──
echo "▸ Pause flag:"
if [[ -f "$PAUSE_FILE" ]]; then
  echo "    ⏸  PAUSED (file exists: $PAUSE_FILE)"
  echo "    Resume with: rm $PAUSE_FILE"
else
  echo "    ▶  active"
fi
echo

# ── Lock file ──
echo "▸ Lock state:"
if [[ -f "$LOCK_FILE" ]]; then
  # Check if anyone is actually holding the lock right now.
  if /usr/bin/lockf -t 0 "$LOCK_FILE" /usr/bin/true 2>/dev/null; then
    echo "    🟢 unlocked (file exists but no holder — normal between runs)"
  else
    echo "    🔒 currently held by a running job"
  fi
else
  echo "    🟢 no lock file (never run, or cleaned up)"
fi
echo

# ── Queue size ──
ENV_FILE="$REPO_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [[ -n "$SUPABASE_URL" && -n "$SUPABASE_KEY" ]]; then
    COUNT_RESP=$(/usr/bin/curl -fsSL --max-time 10 \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Prefer: count=exact" \
      -H "Range: 0-0" \
      "$SUPABASE_URL/rest/v1/submissions?processed=eq.false&select=id" -D - -o /dev/null 2>&1 || true)
    COUNT=$(echo "$COUNT_RESP" | grep -i '^content-range:' | sed 's|.*/||' | tr -d '\r ' || echo "?")
    echo "▸ Unprocessed queue: $COUNT"
  else
    echo "▸ Unprocessed queue: (env vars missing)"
  fi
else
  echo "▸ Unprocessed queue: ($ENV_FILE missing)"
fi
echo

# ── Recent log ──
echo "▸ Last 30 log lines ($LOG_FILE):"
if [[ -f "$LOG_FILE" ]]; then
  tail -30 "$LOG_FILE" | sed 's/^/    /'
else
  echo "    (no log yet — never run)"
fi
echo

echo "▸ Live tail: tail -f $LOG_FILE"
echo "▸ Pause:    touch $PAUSE_FILE"
echo "▸ Resume:   rm $PAUSE_FILE"
echo "▸ Run now:  bash $REPO_ROOT/scripts/process-inbox-auto.sh"
echo "▸ Disable:  launchctl unload $PLIST"
echo "▸ Enable:   launchctl load $PLIST"
