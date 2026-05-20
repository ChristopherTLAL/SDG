export function formatDate(iso: string, lang: string = 'en') {
  const d = new Date(iso);
  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
  // Force UTC: a date-only ISO ("2026-05-20") parses as UTC midnight, so rendering
  // in a local tz west of UTC would show the previous day. Pinning to UTC keeps the
  // displayed calendar date deterministic and consistent with the (UTC) server.
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
}

// 简单阅读时长（英文单词 200 wpm 估算）
export function readingTimeFromText(text: string) {
  const words = text.trim().split(/\s+/g).length;
  return Math.max(1, Math.round(words / 200));
}
