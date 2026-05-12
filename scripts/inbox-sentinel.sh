#!/bin/bash
# inbox-sentinel.sh — dumb local poll that Bark-pushes when new submission arrives.
#
# Polled by launchd (com.sdg.inbox-sentinel, every 120s).
# Replaces the LLM-based auto-archiver after Anthropic banned third-party
# headless OAuth (2026-04-04). No Claude in this loop — just two curls.
#
# Behavior:
#   - Read .env for SUPABASE_SERVICE_ROLE_KEY
#   - GET unprocessed submissions from Supabase
#   - Compare against last-seen IDs (state file)
#   - If any NEW unprocessed IDs appeared → POST a Bark push with brief summary
#   - Else silent
#   - Update state file
#
# State file tracks IDs (not just count) so we don't re-spam when one sits
# unprocessed across multiple polls — only when a new one shows up.

: # unset shell options — be permissive

# ── Paths / config ──
REPO_ROOT="/Users/shijie/Code/sdg-html"
ENV_FILE="$REPO_ROOT/.env"
STATE_DIR="$HOME/Library/Application Support/sdg-inbox-sentinel"
STATE_FILE="$STATE_DIR/seen-ids"
LOG_FILE="$HOME/Library/Logs/sdg-inbox-sentinel.log"

BARK_URL="https://api.day.app/3gNEKJMSZbaaT47F2yh8uL/"
BARK_GROUP="inbox-sentinel"

JQ="/opt/homebrew/bin/jq"
[[ -x "$JQ" ]] || JQ=$(command -v jq || echo "")

# Lockless — script runs <5s, overlap risk is harmless (worst case: 1 duplicate push).

# ── Logging ──
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$STATE_DIR"
ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*" >> "$LOG_FILE"; }

# Log rotation (keep last 256KB if > 2MB)
if [[ -f "$LOG_FILE" ]] && [[ $(stat -f%z "$LOG_FILE" 2>/dev/null || echo 0) -gt 2097152 ]]; then
  tail -c 262144 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  log "log rotated"
fi

# ── Load Supabase creds from .env ──
if [[ ! -f "$ENV_FILE" ]]; then
  log "ERROR: .env not found at $ENV_FILE"
  exit 1
fi
KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
URL=$(grep "^SUPABASE_URL" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
if [[ -z "$KEY" || -z "$URL" ]]; then
  log "ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env"
  exit 1
fi

# ── Fetch unprocessed submissions ──
RESP=$(curl -s --max-time 15 \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/submissions?processed=eq.false&select=id,student_name_raw,type,summary,submitted_by&order=submitted_at.desc")
CURL_RC=$?

if [[ $CURL_RC -ne 0 ]]; then
  log "ERROR: curl Supabase failed (exit=$CURL_RC)"
  exit 0   # don't propagate to launchd; we'll retry next cycle
fi

if [[ -z "$RESP" ]] || [[ "${RESP:0:1}" != "[" ]]; then
  log "ERROR: unexpected Supabase response: ${RESP:0:200}"
  exit 0
fi

# ── Extract current unprocessed IDs (sorted) ──
if [[ -z "$JQ" ]]; then
  log "ERROR: jq not found on PATH; cannot parse response"
  exit 0
fi
CURRENT_IDS=$(echo "$RESP" | "$JQ" -r '.[].id' | sort -n)
N=$(echo "$RESP" | "$JQ" -r 'length')

# ── Diff against seen state ──
SEEN_IDS=""
[[ -f "$STATE_FILE" ]] && SEEN_IDS=$(cat "$STATE_FILE" | sort -n)

# New = currently unprocessed AND not in seen
# Use awk for robust set diff on possibly-empty inputs
NEW_IDS=$(awk 'NR==FNR{seen[$0]=1;next} !seen[$0] && $0!=""' <(echo "$SEEN_IDS") <(echo "$CURRENT_IDS"))
NEW_COUNT=0
if [[ -n "$NEW_IDS" ]]; then
  NEW_COUNT=$(echo "$NEW_IDS" | wc -l | tr -d ' ')
fi

if [[ "$NEW_COUNT" -eq 0 ]]; then
  # No new submissions since last check. Update state (in case some got
  # processed) and exit silent.
  echo "$CURRENT_IDS" > "$STATE_FILE"
  # heartbeat every ~30 polls (~1h)
  HEARTBEAT_FILE="$STATE_DIR/last-heartbeat"
  NOW=$(date +%s)
  LAST=$(cat "$HEARTBEAT_FILE" 2>/dev/null || echo 0)
  if [[ $((NOW - LAST)) -gt 3600 ]]; then
    log "heartbeat — queue=$N, no new IDs in last hour"
    echo "$NOW" > "$HEARTBEAT_FILE"
  fi
  exit 0
fi

# ── There's at least one new submission. Build Bark push. ──
# Show up to 5 lines, summary of new ones.
LINES=$(echo "$RESP" | "$JQ" -r --arg new_ids "$NEW_IDS" '
  ($new_ids | split("\n") | map(tonumber)) as $new |
  map(select(.id as $id | $new | index($id)))
  | sort_by(-.id)
  | .[0:5]
  | map("#\(.id) \(.student_name_raw // "—") / \(.submitted_by) / \(.type) — \(.summary // "(no summary)")")
  | join("\n")
')
MORE_COUNT=$(( NEW_COUNT - 5 ))
if [[ $MORE_COUNT -gt 0 ]]; then
  LINES="$LINES"$'\n'"... +$MORE_COUNT more"
fi

# Construct JSON safely (Chinese + quotes in summary)
BARK_JSON=$("$JQ" -n \
  --arg title "📥 inbox: $NEW_COUNT 条新 submission" \
  --arg body "$LINES" \
  --arg group "$BARK_GROUP" \
  '{title:$title, body:$body, group:$group}')

PUSH_RESP=$(curl -s --max-time 10 -X POST \
  -H "Content-Type: application/json" \
  --data "$BARK_JSON" \
  "$BARK_URL")

if echo "$PUSH_RESP" | grep -q '"code":200'; then
  log "pushed NEW=[$(echo $NEW_IDS | tr '\n' ',' )] queue=$N"
  echo "$CURRENT_IDS" > "$STATE_FILE"
else
  log "ERROR: Bark push failed: ${PUSH_RESP:0:200}"
  # do NOT update state — retry next cycle
fi

exit 0
