#!/usr/bin/env python3
"""
Generate narration audio (MP3) for a book chapter with OpenAI gpt-4o-mini-tts.

Reads OPENAI_API_KEY from .env. Extracts the chapter's passage (the paragraph
sentences only, not vocab/grammar examples) from the .ts file, reads the shared
voice + instructions from the sibling book.ts (overridable via flags), calls the
OpenAI speech endpoint, writes the MP3 under public/audio/english/<book>/, and
patches meta.audioUrl in the chapter file.

Usage (run from repo root):
  python3 .claude/skills/daily-english/scripts/generate-audio.py \
      src/data/english/books/giselle/01-comeback.ts \
      [--voice nova] [--instructions "..."]

Hosting: for now MP3s go under public/ (served statically by Astro/Vercel).
For the full multi-book library, switch to Supabase Storage (TODO: --upload).
"""
import argparse
import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech"
MODEL = "gpt-4o-mini-tts"
MAX_CHARS = 4000  # endpoint hard cap is 4096; leave headroom


def _open(req, timeout=180, tries=3):
    """urlopen with retry on transient connection drops (RemoteDisconnected etc.).
    HTTPError (real API errors like 400/401) is not retried."""
    for i in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except urllib.error.HTTPError:
            raise
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(1.5 * (i + 1))


def load_env(root: Path) -> dict:
    env = {}
    p = root / ".env"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def extract_passage(ts_text: str) -> str:
    # Match only sentence objects: { id: 's<N>', en: '<...>', zh: ... }
    pat = re.compile(
        r"\{\s*id:\s*['\"]s\d+['\"]\s*,\s*en:\s*('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")\s*,\s*zh:",
        re.DOTALL,
    )
    out = []
    for m in pat.finditer(ts_text):
        lit = m.group(1)[1:-1]
        lit = lit.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\").replace("\\n", " ")
        out.append(lit.strip())
    return " ".join(out)


def read_book_tts(chapter_path: Path):
    voice, instructions = "nova", None
    book = chapter_path.parent / "book.ts"
    if book.exists():
        t = book.read_text(encoding="utf-8")
        mv = re.search(r"voice:\s*'([^']*)'", t)
        mi = re.search(r"instructions:\s*'((?:\\.|[^'\\])*)'", t)
        if mv:
            voice = mv.group(1)
        if mi:
            instructions = mi.group(1).replace("\\'", "'")
    return voice, instructions


def chunk_text(text: str, limit: int = MAX_CHARS):
    if len(text) <= limit:
        return [text]
    chunks, cur = [], ""
    for sent in re.split(r"(?<=[.!?])\s+", text):
        if len(cur) + len(sent) + 1 > limit and cur:
            chunks.append(cur.strip())
            cur = sent
        else:
            cur = (cur + " " + sent).strip()
    if cur:
        chunks.append(cur.strip())
    return chunks


def synth(api_key: str, text: str, voice: str, instructions):
    body = {"model": MODEL, "input": text, "voice": voice, "response_format": "mp3"}
    if instructions:
        body["instructions"] = instructions
    req = urllib.request.Request(
        OPENAI_SPEECH_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with _open(req, timeout=180) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        raise SystemExit(f"OpenAI TTS error {e.code}: {detail}")


def supabase_upload(env: dict, book_id: str, stem: str, audio: bytes):
    """Upload to the public 'english-audio' bucket; returns the public URL or None."""
    base = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        return None
    bucket = "english-audio"
    hdr = {"Authorization": f"Bearer {key}", "apikey": key}
    # ensure the bucket exists (idempotent)
    try:
        urllib.request.urlopen(urllib.request.Request(
            f"{base}/storage/v1/bucket",
            data=json.dumps({"id": bucket, "name": bucket, "public": True}).encode(),
            headers={**hdr, "Content-Type": "application/json"}, method="POST",
        ), timeout=30)
    except Exception:
        pass  # bucket already exists, or a transient drop; the upload below is what matters
    object_path = f"{book_id}/{stem}.mp3"
    _open(urllib.request.Request(
        f"{base}/storage/v1/object/{bucket}/{object_path}",
        data=audio,
        headers={**hdr, "Content-Type": "audio/mpeg", "x-upsert": "true", "Cache-Control": "max-age=300"},
        method="POST",
    ), timeout=180)
    return f"{base}/storage/v1/object/public/{bucket}/{object_path}"


def patch_audio_url(ts_text: str, url: str) -> str:
    if re.search(r"audioUrl:\s*'[^']*'", ts_text):
        return re.sub(r"audioUrl:\s*'[^']*'", f"audioUrl: '{url}'", ts_text, count=1)
    return re.sub(r"(cefr:\s*'[^']*',)", r"\1\n    audioUrl: '" + url + "',", ts_text, count=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chapter", help="path to the chapter .ts file")
    ap.add_argument("--voice", default=None, help="override the book's voice")
    ap.add_argument("--instructions", default=None, help="override the book's TTS instructions")
    ap.add_argument("--variant", action="store_true",
                    help="A/B mode: upload to _variants/<stem>-<voice>.mp3 and do NOT patch the chapter")
    args = ap.parse_args()

    root = Path.cwd()
    chapter = Path(args.chapter)
    if not chapter.exists():
        raise SystemExit(f"chapter not found: {chapter}")

    env = load_env(root)
    api_key = env.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not found in .env")

    ts_text = chapter.read_text(encoding="utf-8")
    passage = extract_passage(ts_text)
    if not passage:
        raise SystemExit("no passage sentences extracted from chapter")

    voice, instructions = read_book_tts(chapter)
    if args.voice:
        voice = args.voice
    if args.instructions:
        instructions = args.instructions

    book_id = chapter.parent.name
    stem = chapter.stem
    object_stem = f"_variants/{stem}-{voice}" if args.variant else stem
    out_path = root / "public" / "audio" / "english" / book_id / f"{object_stem}.mp3"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    chunks = chunk_text(passage)
    print(f"voice={voice}  chars={len(passage)}  chunks={len(chunks)}  variant={args.variant}  -> {out_path}")
    audio = b"".join(synth(api_key, c, voice, instructions) for c in chunks)
    out_path.write_bytes(audio)  # local cache (public/audio is gitignored)

    # Host on Supabase Storage so the same URL works in dev, on Vercel, and in PDFs.
    # Re-running upserts the same object, so tuning the voice updates the live audio
    # without a redeploy. Falls back to the local /audio path if Supabase is unset.
    sb_url = supabase_upload(env, book_id, object_stem, audio)

    if args.variant:
        print(json.dumps({"ok": True, "variant": True, "audioUrl": sb_url, "voice": voice}, indent=2))
        return

    url = sb_url or f"/audio/english/{book_id}/{stem}.mp3"
    chapter.write_text(patch_audio_url(ts_text, url), encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "mp3": str(out_path),
        "bytes": len(audio),
        "audioUrl": url,
        "hosted": "supabase" if sb_url else "local",
        "voice": voice,
    }, indent=2))


if __name__ == "__main__":
    main()
