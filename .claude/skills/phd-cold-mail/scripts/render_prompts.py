#!/usr/bin/env python3
"""
Render fused end-to-end subagent prompts for every supervisor on a student's
shortlist. Used by the `phd-cold-mail` skill's Mode B (full-batch mode).

Reads:
- Vault student RP (auto-discovered in `01_Student/{name}/文书材料/`,
  prefers .docx → textutil, then .pdf → pdftotext, then .md / .tex raw)
- Vault student CV (same discovery)
- Supervisor shortlist via `parse_shortlist.py` (autodiscovers latest Excel)
- Template at `references/end_to_end_prompt.md`

Writes:
- One .md per supervisor at `/tmp/phd_prompts_{student}/{NNN}_{slug}.md`
  Each file is a fully-rendered prompt the subagent will Read and execute.
- A manifest at `/tmp/phd_prompts_{student}/MANIFEST.json` listing each
  prompt path + intended output path + supervisor row metadata.

Usage:
    python3 render_prompts.py STUDENT_NAME [--vault PATH] [--top-only N]
                              [--include-skipped] [--out-dir DIR]
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
SKILL_DIR = THIS_DIR.parent
TEMPLATE_PATH = SKILL_DIR / "references" / "end_to_end_prompt.md"
PARSE_SCRIPT = THIS_DIR / "parse_shortlist.py"


def slug(name: str) -> str:
    """Filesystem-safe slug for a supervisor name."""
    s = re.sub(r"[\s/\\:*?\"<>|]+", "_", name)
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def find_first(folder: Path, patterns):
    """Return first file matching any of the case-insensitive substring patterns."""
    if not folder.exists():
        return None
    files = list(folder.iterdir())
    for pat in patterns:
        for f in files:
            if pat.lower() in f.name.lower() and f.is_file():
                return f
    return None


def extract_text(path: Path) -> str:
    """Extract plain text from PDF, DOCX, MD, or TeX file."""
    suf = path.suffix.lower()
    if suf == ".pdf":
        out = subprocess.run(
            ["pdftotext", "-layout", str(path), "-"],
            capture_output=True, text=True, check=False
        )
        return out.stdout
    if suf == ".docx":
        out = subprocess.run(
            ["textutil", "-convert", "txt", "-stdout", str(path)],
            capture_output=True, text=True, check=False
        )
        return out.stdout
    if suf in (".md", ".tex", ".txt"):
        return path.read_text(encoding="utf-8", errors="replace")
    return ""


def load_supervisors(student: str, vault: str, top_only, include_skipped):
    """Call parse_shortlist.py and parse its JSON output."""
    args = ["python3", str(PARSE_SCRIPT), student, "--vault", vault]
    if top_only is not None:
        args += ["--top-only", str(top_only)]
    if include_skipped:
        args.append("--include-skipped")
    p = subprocess.run(args, capture_output=True, text=True, check=False)
    if p.returncode != 0:
        print(f"ERROR running parse_shortlist.py:\n{p.stderr}", file=sys.stderr)
        sys.exit(2)
    print(p.stderr, file=sys.stderr, end="")  # forward diagnostics
    # stdout is JSON (only when --markdown not set)
    try:
        return json.loads(p.stdout)
    except json.JSONDecodeError as e:
        print(f"ERROR parsing parse_shortlist.py JSON output: {e}", file=sys.stderr)
        print(f"stdout was: {p.stdout[:500]}...", file=sys.stderr)
        sys.exit(3)


def render(template: str, sub: dict, rp: str, cv: str, output_path: str) -> str:
    """Substitute placeholders. Empty fields become explicit blanks."""
    def get(field, default=""):
        v = sub.get(field)
        return v if v else default

    top_rank = sub.get("top_rank")
    top_rank_str = f"★{top_rank}" if top_rank else "(unranked)"
    top_rank_or_null = str(top_rank) if top_rank else "null"

    rendered = template
    subs = {
        "{SUPERVISOR_NAME}": get("name"),
        "{KNOWN_SCHOOL}": get("school"),
        "{DEPARTMENT}": get("department"),
        "{MATCH_REASON}": get("match_reason"),
        "{TOP_RANK}": top_rank_str,
        "{TOP_RANK_OR_NULL}": top_rank_or_null,
        "{HOMEPAGE}": get("homepage"),
        "{STUDENT_RP}": rp.strip(),
        "{STUDENT_CV}": cv.strip(),
        "{OUTPUT_PATH}": output_path,
    }
    for k, v in subs.items():
        rendered = rendered.replace(k, v)
    return rendered


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("student", help="Student folder name in vault `01_Student/`")
    ap.add_argument(
        "--vault",
        default=os.environ.get("OBSIDIAN_VAULT_ROOT", "/Users/shijie/Obsidian/规划看板"),
    )
    ap.add_argument("--top-only", type=int, default=None)
    ap.add_argument("--include-skipped", action="store_true")
    ap.add_argument(
        "--out-dir",
        default=None,
        help="Where to write rendered prompts (default: /tmp/phd_prompts_{student})",
    )
    ap.add_argument(
        "--output-base",
        default=None,
        help="Where subagents should write final emails (default: vault `01_Student/{student}/个性化材料/PhD套磁/邮件草稿/`)",
    )
    ap.add_argument("--clean", action="store_true", help="Remove out-dir before rendering")
    args = ap.parse_args()

    student = args.student
    vault = args.vault

    student_dir = Path(vault) / "01_Student" / student
    if not student_dir.exists():
        print(f"ERROR: student folder not found: {student_dir}", file=sys.stderr)
        sys.exit(1)

    # Find RP + CV
    wenshu = student_dir / "文书材料"
    rp_file = find_first(wenshu, ["_RP_", "_RP.", "research_proposal", "research proposal", "_SoP_", "statement of purpose"])
    cv_file = find_first(wenshu, ["_CV_", "_CV.", "resume"])
    if not rp_file:
        print(f"ERROR: RP not found in {wenshu}", file=sys.stderr)
        sys.exit(1)
    if not cv_file:
        print(f"ERROR: CV not found in {wenshu}", file=sys.stderr)
        sys.exit(1)

    rp_text = extract_text(rp_file)
    cv_text = extract_text(cv_file)
    if not rp_text.strip() or not cv_text.strip():
        print(f"ERROR: empty RP ({len(rp_text)} chars) or CV ({len(cv_text)} chars)", file=sys.stderr)
        sys.exit(1)

    print(f"# RP: {rp_file.name} ({len(rp_text)} chars)", file=sys.stderr)
    print(f"# CV: {cv_file.name} ({len(cv_text)} chars)", file=sys.stderr)

    template = TEMPLATE_PATH.read_text(encoding="utf-8")

    # Output directories
    out_dir = Path(args.out_dir) if args.out_dir else Path(f"/tmp/phd_prompts_{student}")
    output_base = (
        Path(args.output_base)
        if args.output_base
        else student_dir / "个性化材料" / "PhD套磁" / "邮件草稿"
    )

    if args.clean and out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_base.mkdir(parents=True, exist_ok=True)

    # Load supervisors
    supervisors = load_supervisors(student, vault, args.top_only, args.include_skipped)
    print(f"# Supervisors to render: {len(supervisors)}", file=sys.stderr)

    manifest = []
    for i, sub in enumerate(supervisors, start=1):
        name = sub.get("name", f"unknown_{i}")
        rank = sub.get("top_rank")
        nnn = f"{rank:03d}" if rank else f"u{i:03d}"  # ranked get rank #, others get u### (unranked)
        filename_slug = slug(name)
        prompt_path = out_dir / f"{nnn}_{filename_slug}.md"
        output_path = output_base / f"{nnn}_{filename_slug}.md"

        rendered = render(template, sub, rp_text, cv_text, str(output_path))
        prompt_path.write_text(rendered, encoding="utf-8")

        manifest.append({
            "id": i,
            "rank": rank,
            "name": name,
            "school": sub.get("school"),
            "department": sub.get("department"),
            "prompt_path": str(prompt_path),
            "output_path": str(output_path),
        })

    manifest_path = out_dir / "MANIFEST.json"
    manifest_path.write_text(
        json.dumps(
            {
                "student": student,
                "generated_at": datetime.now().isoformat(timespec="seconds"),
                "rp_file": str(rp_file),
                "cv_file": str(cv_file),
                "output_base": str(output_base),
                "total": len(manifest),
                "supervisors": manifest,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"# Wrote {len(manifest)} prompts to {out_dir}/", file=sys.stderr)
    print(f"# Manifest: {manifest_path}", file=sys.stderr)
    print(f"# Output base (subagent writes here): {output_base}", file=sys.stderr)
    # Stdout = manifest path so caller can pipe
    print(str(manifest_path))


if __name__ == "__main__":
    main()
