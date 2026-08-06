"""Build a standalone, classmate-safe copy of a study tool.

Inlines primer.css / primer-harness.js / encourage.js, drops the dashboard
back-link, and rewrites first-person-about-the-professor phrasing so the file
reads fine to someone who isn't Vivian.

Usage:  python build-share.py <source.html> <share/output.html>
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent


def inline(html: str, tag_pattern: str, asset: str, wrapper: str) -> str:
    body = (ROOT / asset).read_text(encoding="utf-8")
    return re.sub(tag_pattern, lambda _: wrapper.format(body=body), html, count=1)


# Phrasing that only makes sense to the person who sat in the lecture.
REPHRASE = [
    ("built from what she pointed at in lecture", "built from the pages flagged in lecture"),
    ("Every question here comes from a page she told you to highlight.",
     "Every question here comes from a page the professor told the class to highlight."),
    ("the ones she said &ldquo;this is not a trick question&rdquo; or repeated",
     "the ones flagged as &ldquo;not a trick question&rdquo; or repeated in lecture"),
    ("She said this one is not a trick question.", "Flagged in lecture as &ldquo;not a trick question.&rdquo;"),
    ("She said it plainly: this is not a trick question.", "Stated plainly in lecture as &ldquo;not a trick question.&rdquo;"),
    ("she specifically pointed at the salt line", "the salt line was called out specifically"),
    ("she read it line by line", "it was read line by line in lecture"),
    ("She flagged the cardiac piece specifically.", "The cardiac piece was flagged specifically."),
    ("The yellow CORE rows on your checklist are", "The CORE items are"),
    ("those show up more than once below on purpose",
     "those show up more than once below on purpose"),
    ("Any block under 80% means go back to the yellow CORE rows on the checklist for that section. "
     "Pointer lecture means the book is the slide deck &mdash; the fix is always a page number, not more notes.",
     "Any block under 80% means go back to the book for that section. "
     "The fix is always a page number, not more notes."),
]


def main() -> int:
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    html = src.read_text(encoding="utf-8")

    html = inline(html, r'<link rel="stylesheet" href="primer\.css">', "primer.css",
                  "<style>\n{body}\n</style>")
    html = inline(html, r'<script src="primer-harness\.js"></script>', "primer-harness.js",
                  "<script>\n{body}\n</script>")
    html = inline(html, r'<script src="encourage\.js"></script>', "encourage.js",
                  "<script>\n{body}\n</script>")

    html = re.sub(r'\s*<a href="index\.html" class="back-link">.*?</a>\n?', "\n", html, count=1)

    for old, new in REPHRASE:
        html = html.replace(old, new)

    leftovers = re.findall(r'(?:href|src)="(?!https?://|#)([^"]+)"', html)
    if leftovers:
        print(f"WARNING: still references local files: {leftovers}")

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(html, encoding="utf-8")
    print(f"wrote {dst}  ({dst.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
