#!/bin/bash
# Cron wrapper: send ONE next-unsent cold-mail draft for 刘锦楠, human-paced.
# - mkdir-based lock (portable on macOS; flock is Linux-only) so overlapping cron
#   firings never double-send.
# - random 0-4 min jitter so the cadence isn't a detectable fixed interval (WASCL).
# - calls liujinnan_send_one.py which is idempotent (diffs against Sent folder).
# Install: */15 * * * * /bin/bash <thispath>  >> /tmp/liujinnan_send.log 2>&1
# Stop:    crontab -e and remove the line (or `touch /tmp/liujinnan_send.STOP`).

SCRIPT_DIR="/Users/shijie/Code/sdg-html/.claude/skills/phd-cold-mail/scripts"
PY="$SCRIPT_DIR/liujinnan_send_one.py"
LOG="/tmp/liujinnan_send.log"
LOCKDIR="/tmp/liujinnan_send.lock.d"
STOP="/tmp/liujinnan_send.STOP"

# kill-switch: create this file to pause sending without editing crontab
if [ -f "$STOP" ]; then
    echo "$(date '+%F %T') [skip] STOP file present" >> "$LOG"
    exit 0
fi

# atomic lock — if a previous run is still going, skip this firing
if ! mkdir "$LOCKDIR" 2>/dev/null; then
    echo "$(date '+%F %T') [skip] already running" >> "$LOG"
    exit 0
fi
trap 'rmdir "$LOCKDIR" 2>/dev/null' EXIT

# ---- PRE-FLIGHT GUARD A: proxy. 松果加速器 (SOCKS 127.0.0.1:7892) blackholes SMTP,
# so every send would stick in Outbox. Refuse to send while it's active. ----
PROXY_INFO=$(/usr/sbin/scutil --proxy 2>/dev/null)
if echo "$PROXY_INFO" | grep -qE "(SOCKSPort|HTTPSPort|HTTPPort)[[:space:]]*:[[:space:]]*7892"; then
    if echo "$PROXY_INFO" | grep -qE "(SOCKSEnable|HTTPSEnable|HTTPEnable)[[:space:]]*:[[:space:]]*1"; then
        echo "$(date '+%F %T') [GUARD] system proxy on :7892 (松果) — SMTP unreliable; touching STOP, refusing to send" >> "$LOG"
        touch "$STOP"
        exit 0
    fi
fi

# ---- PRE-FLIGHT GUARD B: Outbox must be empty. A non-empty Outbox means a prior
# send never transmitted (SMTP/proxy/WASCL). Piling more on is exactly the 37-dupe
# bug. Touch STOP and bail. ----
OB=$(/usr/bin/osascript -e 'with timeout of 20 seconds
    tell application "Mail"
        try
            return (count of messages of mailbox "Outbox") as text
        on error
            try
                return (count of messages of mailbox "发件箱") as text
            on error
                return "0"
            end try
        end try
    end tell
end timeout' 2>/dev/null)
if [ -n "$OB" ] && [ "$OB" -gt 0 ] 2>/dev/null; then
    echo "$(date '+%F %T') [GUARD] Outbox backlog=$OB before send — SMTP stuck; touching STOP, refusing to send" >> "$LOG"
    touch "$STOP"
    exit 0
fi

# random jitter 0-240s
JITTER=$((RANDOM % 240))
echo "$(date '+%F %T') [wake] jitter ${JITTER}s" >> "$LOG"
sleep "$JITTER"

# Mail.app health check: ping with a 20s budget; if it hangs/fails, restart Mail.
# (Mail.app degrades over long uptime -> AppleScript calls time out / -609.)
# Health check mirrors the real workload that degraded (mailbox access), not just
# a name ping — a slow-but-alive Mail.app passes a name ping yet hangs on mailbox ops.
mail_ok() {
    /usr/bin/osascript -e 'with timeout of 25 seconds
        tell application "Mail"
            set acct to account "B. 学生 - 刘锦楠"
            try
                set mb to mailbox "草稿" of acct
            on error
                return "noacct"
            end try
            return (count of messages of mb) as text
        end tell
    end timeout' >/dev/null 2>&1
}
if ! mail_ok; then
    echo "$(date '+%F %T') [heal] Mail.app unresponsive -> restarting" >> "$LOG"
    /usr/bin/pkill -9 -f "Mail.app/Contents/MacOS/Mail" 2>/dev/null
    sleep 8
    /usr/bin/open -a Mail
    sleep 35
    if ! mail_ok; then
        echo "$(date '+%F %T') [heal] Mail.app still down after restart; skip this cycle" >> "$LOG"
        exit 0
    fi
    echo "$(date '+%F %T') [heal] Mail.app back up" >> "$LOG"
fi

# send one
OUT=$(/usr/bin/python3 "$PY" 2>&1)
echo "$(date '+%F %T') $OUT" >> "$LOG"

# if Python signalled Mail needs restart (exit 3 path prints 'needs restart'), heal next cycle
if echo "$OUT" | grep -q "needs restart\|unresponsive"; then
    echo "$(date '+%F %T') [heal] python flagged Mail unresponsive -> restarting now" >> "$LOG"
    /usr/bin/pkill -9 -f "Mail.app/Contents/MacOS/Mail" 2>/dev/null
    sleep 8
    /usr/bin/open -a Mail
    sleep 30
fi

# GLOBAL STOP from python (circuit breaker tripped): python already touched STOP;
# unload the agent so it stops firing entirely until a human investigates.
if echo "$OUT" | grep -q "^STOP \|touched STOP"; then
    launchctl unload "$HOME/Library/LaunchAgents/com.sdg.liujinnan-send.plist" 2>/dev/null
    echo "$(date '+%F %T') [HALT] circuit breaker tripped — STOP set, agent unloaded. Investigate before resuming." >> "$LOG"
fi

# if all done, stop cleanly: touch STOP, unload launchd agent, strip any crontab line
if echo "$OUT" | grep -q "ALL_SENT"; then
    touch "$STOP"
    launchctl unload "$HOME/Library/LaunchAgents/com.sdg.liujinnan-send.plist" 2>/dev/null
    crontab -l 2>/dev/null | grep -v "liujinnan_send_loop.sh" | crontab - 2>/dev/null
    echo "$(date '+%F %T') [done] ALL_SENT — agent stopped" >> "$LOG"
fi
