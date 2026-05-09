#!/usr/bin/env python3
"""
normalize-schools.py — fix school-name dups/typos in vault YAML.

Reads each 01_Student/<name>/<name>.md, looks up `目前就读学校:` in the
normalize map, and rewrites the YAML field if a canonical form exists.
Idempotent.

After running, also rerun:
    /opt/homebrew/bin/node scripts/sync-students-to-supabase.mjs
"""
import re
from pathlib import Path

VAULT = Path('/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板/01_Student')

# Map: as-recorded → canonical name
# Conservative — only normalize when CONFIDENT. Ambiguous (DS/UCD/西华
# /苏城/etc.) are left alone to flag for user.
SCHOOL_NORMALIZE = {
    # ── 西浦 family ──
    '西浦': '西交利物浦大学',
    '西交利物浦': '西交利物浦大学',
    '西交利物浦大学4+0': '西交利物浦大学',
    '西交利物浦，2+1+1': '西交利物浦大学',
    '西浦40': '西交利物浦大学',

    # ── 苏州大学 ──
    '苏大': '苏州大学',
    '苏大管理': '苏州大学',
    '物联网苏大应用': '苏州大学',

    # ── 苏州科技 ──
    '苏科大': '苏州科技大学',

    # ── 昆山杜克 ──
    '昆杜': '昆山杜克大学',

    # ── 南京医科 ──
    '南京医科': '南京医科大学',

    # ── 俄亥俄州立 ──
    '俄亥俄州立': '俄亥俄州立大学',
    'OSU': '俄亥俄州立大学',  # 苏州团队学生最常去的是俄州立 (Ohio State)

    # ── 俄勒冈州立 ──
    '俄勒冈州立': '俄勒冈州立大学',

    # ── 爱丁堡 ──
    '爱丁堡': '爱丁堡大学',

    # ── 人民大学 ──
    '人民大学': '中国人民大学苏州校区',  # 苏州团队学生几乎都是苏州校区

    # ── 南京大学 (合并冗长 学院 名称) ──
    '南京大学南京赫尔辛基大气与地球系统科学学院': '南京大学',

    # ── 华东理工 ──
    '华东理工': '华东理工大学',

    # ── 美校缩写 ──
    '雪城': '雪城大学',
    '罗切斯特': '罗切斯特大学',
    '伦斯勒理工': '伦斯勒理工学院',
    '圣克鲁兹': '加州大学圣克鲁兹分校',
    'BU': '波士顿大学',
    'MSU': '密歇根州立大学',
    'PSU': '宾夕法尼亚州立大学',
    'UCSB': '加州大学圣塔芭芭拉分校',
    'UCL': '伦敦大学学院',

    # ── 宁波诺丁汉 ──
    '宁诺': '宁波诺丁汉大学',
    '宁诺2+2': '宁波诺丁汉大学',

    # ── 简称 ──
    '南财': '南京财经大学',
    '山大': '山东大学',
    '大连海事': '大连海事大学',
    '东北大学': '东北大学',  # explicit no-op
    '华盛顿大学': '华盛顿大学',  # explicit no-op (could be StL or Seattle, leave alone)

    # ── Placeholders → 待补 (canonical empty) ──
    '已本科毕业': '待补',
    '待确认': '待补',
    '待补充': '待补',
    '未知': '待补',
    '': '待补',
}


def main():
    rewritten = 0
    untouched = 0
    seen_unique = set()
    rewrite_log = []

    for p in sorted(VAULT.iterdir()):
        if not p.is_dir() or p.name.startswith('_'):
            continue
        md = p / f'{p.name}.md'
        if not md.exists():
            continue
        text = md.read_text(encoding='utf-8')
        m = re.search(r'^目前就读学校:\s*(.*?)\s*$', text, re.MULTILINE)
        if not m:
            continue
        raw = m.group(1)
        seen_unique.add(raw)
        if raw in SCHOOL_NORMALIZE:
            canonical = SCHOOL_NORMALIZE[raw]
            if canonical == raw:
                untouched += 1
                continue
            new_line = f'目前就读学校: {canonical}'
            new_text = re.sub(
                r'^目前就读学校:.*$',
                new_line,
                text,
                count=1,
                flags=re.MULTILINE,
            )
            md.write_text(new_text, encoding='utf-8')
            rewrite_log.append(f'{p.name}: "{raw}" → "{canonical}"')
            rewritten += 1
        else:
            untouched += 1

    print(f'═══ Normalization complete ═══')
    print(f'  Rewritten:    {rewritten}')
    print(f'  Untouched:    {untouched}')
    print(f'  Unique raw values seen: {len(seen_unique)}')
    print()
    if rewrite_log:
        print('Sample rewrites (first 30):')
        for line in rewrite_log[:30]:
            print(f'  {line}')


if __name__ == '__main__':
    main()
