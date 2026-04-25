// Resolve Obsidian-style wikilinks `[[target]]` and `[[target|alias]]` in markdown
// against a known set of student-scope notes. Unknown targets render as a greyed
// "unresolved" pill so the visual matches Obsidian.
//
// We preprocess the raw markdown string (replacing wikilinks with standard markdown
// links or inline HTML), then hand the result to a markdown renderer.

export type WikilinkTarget =
  | { kind: 'student'; studentId: number; studentName: string }
  | { kind: 'note'; studentId: number; studentName: string; noteName: string }
  | { kind: 'attachment'; studentId: number; studentName: string; filename: string };

export type WikilinkIndex = Map<string, WikilinkTarget>;

export function buildWikilinkIndex(input: {
  students: { id: number; name: string; attachments: string[] | null }[];
  notes: { student_id: number; note_name: string; student_name?: string }[];
}): WikilinkIndex {
  const index: WikilinkIndex = new Map();

  // Notes win over students if names happen to collide (they shouldn't, but be safe).
  for (const s of input.students) {
    index.set(s.name, { kind: 'student', studentId: s.id, studentName: s.name });

    for (const att of s.attachments ?? []) {
      // Index by full filename and by basename without extension.
      index.set(att, { kind: 'attachment', studentId: s.id, studentName: s.name, filename: att });
      const dot = att.lastIndexOf('.');
      if (dot > 0) {
        const stem = att.slice(0, dot);
        if (!index.has(stem)) {
          index.set(stem, { kind: 'attachment', studentId: s.id, studentName: s.name, filename: att });
        }
      }
    }
  }

  const studentNameById = new Map(input.students.map(s => [s.id, s.name]));
  for (const n of input.notes) {
    const studentName = n.student_name ?? studentNameById.get(n.student_id) ?? '';
    index.set(n.note_name, {
      kind: 'note',
      studentId: n.student_id,
      studentName,
      noteName: n.note_name,
    });
  }

  return index;
}

// Slugify a note name into something usable as an HTML id anchor.
// We just URL-encode and replace problematic chars; collisions are unlikely.
export function noteAnchor(noteName: string): string {
  return 'note-' + encodeURIComponent(noteName).replace(/%/g, '_');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Match `[[target]]`, `[[target|alias]]`, `![[target]]`, and `![[target|alias]]`.
// Stops at `]]` so it doesn't span lines or tables. Non-greedy on inner content.
const WIKILINK_RE = /(!?)\[\[([^\[\]\n|]+?)(?:\|([^\[\]\n]+?))?\]\]/g;

export function resolveWikilinks(markdown: string, index: WikilinkIndex): string {
  return markdown.replace(WIKILINK_RE, (_full, embed: string, target: string, alias: string | undefined) => {
    const display = (alias ?? target).trim();
    const targetTrim = target.trim();
    const hit = index.get(targetTrim);
    const isEmbed = embed === '!';

    if (!hit) {
      // Unresolved: greyed-out pill, no link. Keep brackets visible so it's clearly an Obsidian link.
      return `<span class="wikilink wikilink-unresolved" title="未在站内同步范围内找到「${escapeHtml(targetTrim)}」">[[${escapeHtml(display)}]]</span>`;
    }

    if (hit.kind === 'student') {
      const href = `/internal/students/${hit.studentId}`;
      return `<a class="wikilink wikilink-student" href="${href}">${escapeHtml(display)}</a>`;
    }

    if (hit.kind === 'note') {
      const href = `/internal/students/${hit.studentId}#${noteAnchor(hit.noteName)}`;
      return `<a class="wikilink wikilink-note" href="${href}">${escapeHtml(display)}</a>`;
    }

    // attachment — MVP: no download, just show the filename with a paperclip-style hint.
    const label = isEmbed ? `嵌入：${display}` : display;
    return `<span class="wikilink wikilink-attachment" title="附件位于 Obsidian: 01_Student/${escapeHtml(hit.studentName)}/个性化材料/${escapeHtml(hit.filename)}">📎 ${escapeHtml(label)}</span>`;
  });
}
