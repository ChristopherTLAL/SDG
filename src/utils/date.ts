export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

// 简单阅读时长（英文单词 200 wpm 估算）
export function readingTimeFromText(text: string) {
  const words = text.trim().split(/\s+/g).length;
  return Math.max(1, Math.round(words / 200));
}
