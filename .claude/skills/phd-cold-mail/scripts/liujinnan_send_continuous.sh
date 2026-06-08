#!/bin/bash
# Continuous supervised sender for 刘锦楠 cold-mail.
# Sends one-at-a-time with a randomized gap, and AFTER/BEFORE each send scans the
# INBOX for Microsoft account-warning emails or NDR/bounce-backs. ANY new warning
# => touch STOP + halt. Also halts on any non-SENT result (send_one.py's own
# Outbox/proxy circuit breakers). Idempotent via the persistent ledger.
#
# Usage: bash liujinnan_send_continuous.sh [min_gap] [max_gap]
PY="/Users/shijie/Code/sdg-html/.claude/skills/phd-cold-mail/scripts/liujinnan_send_one.py"
LOG="/tmp/liujinnan_continuous.log"
ACCT="B. 学生 - 刘锦楠"
MIN_GAP="${1:-80}"
SPAN="${2:-70}"   # gap = MIN_GAP + rand(0..SPAN)  -> 80..150s default
MAX="${3:-0}"     # daily quota: stop after MAX successful sends (0 = unlimited).
                  # outlook.com consumer daily limit for this account ≈ 20/day —
                  # use e.g. 18 to stay safely under it and avoid the block email.

log(){ echo "$(date '+%F %T')  $*" | tee -a "$LOG"; }
osa(){ /usr/bin/osascript -e "$1" 2>/dev/null; }

# Scan recent inbox for warning/bounce signatures -> prints "sender | subject" lines.
inbox_hits(){
  osa 'tell application "Mail"
    set acct to account "'"$ACCT"'"
    set inb to mailbox "收件箱" of acct
    set n to (count of messages of inb)
    set lim to n
    if lim > 12 then set lim to 12
    set out to ""
    repeat with i from 1 to lim
      try
        set m to message i of inb
        set sndr to (sender of m)
        set subj to (subject of m)
        if (sndr contains "accountprotection") or (sndr contains "account-security") or (sndr contains "postmaster") or (sndr contains "mailer-daemon") or (sndr contains "Microsoft account") or (subj contains "unusual") or (subj contains "Unusual") or (subj contains "suspicious") or (subj contains "Suspicious") or (subj contains "suspend") or (subj contains "Suspend") or (subj contains "blocked") or (subj contains "Blocked") or (subj contains "Undeliverable") or (subj contains "undeliverable") or (subj contains "Delivery Status") or (subj contains "could not be delivered") or (subj contains "Mail Delivery") or (subj contains "异常") or (subj contains "暂停") or (subj contains "退信") or (subj contains "限制") or (subj contains "被阻止") then
          set out to out & sndr & " | " & subj & linefeed
        end if
      end try
    end repeat
    return out
  end tell'
}

# --- pre-flight: proxy must be off (else SMTP stuck) ---
P=$(/usr/sbin/scutil --proxy 2>/dev/null)
if echo "$P" | grep -qE "(SOCKSPort|HTTPSPort|HTTPPort)[[:space:]]*:[[:space:]]*7892" \
   && echo "$P" | grep -qE "(SOCKSEnable|HTTPSEnable|HTTPEnable)[[:space:]]*:[[:space:]]*1"; then
    log "ABORT: 7892 proxy active — fix proxy first"; exit 1
fi

# --- baseline: ignore pre-existing inbox warnings ---
BASELINE="$(inbox_hits | sort -u)"
log "[continuous] start. baseline inbox-warning lines: $(echo "$BASELINE" | grep -c .)"

sent=0
while true; do
    # 1. inbox warning check BEFORE next send (prior send's warning had the full gap to arrive)
    CUR="$(inbox_hits | sort -u)"
    NEW="$(comm -13 <(echo "$BASELINE") <(echo "$CUR") | grep .)"
    if [ -n "$NEW" ]; then
        log ">>> HALT: NEW inbox warning / bounce detected:"
        echo "$NEW" | while read -r ln; do log "      ⚠️  $ln"; done
        touch /tmp/liujinnan_send.STOP
        break
    fi

    # 2. send one
    OUT=$(/usr/bin/python3 "$PY" 2>&1)
    log "$OUT"
    case "$OUT" in
        SENT*)      sent=$((sent+1)) ;;
        ALL_SENT*)  log ">>> ALL_SENT — all drafts sent. total this run: $sent"; break ;;
        *)          log ">>> HALT: send result not SENT -> stopping (circuit breaker)"; break ;;
    esac

    # daily quota guard: stop cleanly once today's cap is reached (avoids the
    # "Outlook.com has blocked your message" daily-limit email)
    if [ "$MAX" -gt 0 ] && [ "$sent" -ge "$MAX" ]; then
        log ">>> DAILY QUOTA reached ($sent/$MAX) — stopping cleanly for today"
        break
    fi

    # 3. quick post-send inbox re-check (catch an instant bounce)
    CUR2="$(inbox_hits | sort -u)"
    NEW2="$(comm -13 <(echo "$BASELINE") <(echo "$CUR2") | grep .)"
    if [ -n "$NEW2" ]; then
        log ">>> HALT: inbox warning / bounce right after send:"
        echo "$NEW2" | while read -r ln; do log "      ⚠️  $ln"; done
        touch /tmp/liujinnan_send.STOP
        break
    fi

    # 4. randomized gap
    G=$(( MIN_GAP + RANDOM % SPAN ))
    log "[gap ${G}s] sent-this-run=$sent"
    sleep "$G"
done
log "=== CONTINUOUS DONE: $sent sent this run ==="
