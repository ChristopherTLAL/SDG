#!/bin/bash
# Supervised batch sender: send up to N, halt on first non-SENT, guard proxy+Outbox.
N=${1:-10}
GAP=${2:-60}
PY=/Users/shijie/Code/sdg-html/.claude/skills/phd-cold-mail/scripts/liujinnan_send_one.py

# pre-batch proxy guard (7892 back on => abort, don't send into a broken SMTP)
P=$(/usr/sbin/scutil --proxy 2>/dev/null)
if echo "$P" | grep -qE "(SOCKSPort|HTTPSPort|HTTPPort)[[:space:]]*:[[:space:]]*7892" \
   && echo "$P" | grep -qE "(SOCKSEnable|HTTPSEnable|HTTPEnable)[[:space:]]*:[[:space:]]*1"; then
    echo "ABORT: 7892 proxy active — fix proxy first"; exit 1
fi

sent=0
for i in $(seq 1 "$N"); do
    OUT=$(/usr/bin/python3 "$PY" 2>&1)
    echo "[$i/$N] $(date +%T)  $OUT"
    case "$OUT" in
        SENT*)     sent=$((sent+1)) ;;
        ALL_SENT*) echo ">>> ALL_SENT — nothing left"; break ;;
        *)         echo ">>> HALT: non-SENT result -> stopping batch immediately"; break ;;
    esac
    if [ "$i" -lt "$N" ]; then sleep "$GAP"; fi
done
echo "=== BATCH DONE: ${sent} sent this batch ==="
