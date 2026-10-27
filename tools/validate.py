#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Repository self-check for the divorce-lawyer skill.

Runs on the Python standard library only so CI needs no dependencies:

    python tools/validate.py

Checks
  1. SKILL.md exists, has YAML frontmatter, and carries a valid kebab-case
     `name` and a non-empty `description`.
  2. The skill name matches the repository directory name.
  3. Every `references/...md` path mentioned in SKILL.md exists on disk.
  4. The Civil Code files together contain exactly 1260 articles.
  5. No reference file is empty or missing a heading.
  6. All text files are UTF-8 without a BOM.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "references"

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ARTICLE_RE = re.compile(r"^第[零一二三四五六七八九十百千]+条", re.M)
EXPECTED_ARTICLES = 1260

errors: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def read_utf8(path: Path) -> str:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        fail(f"{path.relative_to(ROOT)}: 含 UTF-8 BOM")
        raw = raw[3:]
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        fail(f"{path.relative_to(ROOT)}: 不是合法 UTF-8（{exc}）")
        return ""


def parse_frontmatter(text: str) -> dict[str, str] | None:
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end < 0:
        return None
    block = text[3:end]
    data: dict[str, str] = {}
    for line in block.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        data[key.strip()] = value.strip().strip("\"'")
    return data


def check_skill_md() -> str:
    path = ROOT / "SKILL.md"
    if not path.is_file():
        fail("SKILL.md 不存在")
        return ""

    text = read_utf8(path)
    meta = parse_frontmatter(text)
    if meta is None:
        fail("SKILL.md 缺少 YAML frontmatter（需以 --- 开头并以 --- 结束）")
        return text

    name = meta.get("name", "")
    desc = meta.get("description", "")

    if not name:
        fail("frontmatter 缺少 name")
    elif not NAME_RE.match(name):
        fail(f"name 不是 kebab-case：{name!r}")
    elif name != ROOT.name:
        warn(f"name（{name}）与目录名（{ROOT.name}）不一致，克隆到技能目录后可能不是预期名称")

    if not desc:
        fail("frontmatter 缺少 description")
    elif len(desc) > 1024:
        fail(f"description 过长（{len(desc)} 字符，上限 1024）")

    body = text.split("\n---", 1)[-1]
    if len(body.strip()) < 2000:
        fail(f"SKILL.md 正文过短（{len(body.strip())} 字符）")

    return text


def check_reference_paths(skill_text: str) -> None:
    mentioned = set(re.findall(r"references/[\w\u4e00-\u9fff\-/]+\.md", skill_text))
    if not mentioned:
        warn("SKILL.md 未引用任何 references 文件")
        return
    for rel in sorted(mentioned):
        if not (ROOT / rel).is_file():
            fail(f"SKILL.md 引用了不存在的文件：{rel}")


def check_statutes() -> None:
    code_dir = REF / "民法典"
    if not code_dir.is_dir():
        fail("references/民法典/ 不存在")
        return

    per_book = {}
    total = 0
    for path in sorted(code_dir.glob("*.md")):
        text = read_utf8(path)
        if not text.strip():
            fail(f"{path.relative_to(ROOT)}: 空文件")
            continue
        if not text.lstrip().startswith("#"):
            fail(f"{path.relative_to(ROOT)}: 缺少一级标题")
        count = len(ARTICLE_RE.findall(text))
        per_book[path.name] = count
        if path.name.startswith("17-"):
            continue  # 合并全文，不重复计数
        total += count

    if total != EXPECTED_ARTICLES:
        fail(f"民法典条文总数为 {total}，应为 {EXPECTED_ARTICLES}")
    else:
        print(f"  [ok] 民法典条文总数 {total}")

    for name, count in per_book.items():
        if count == 0 and not name.startswith(("17-", "00-")):
            fail(f"{name}: 未识别到任何条文")

    jd = REF / "司法解释"
    if not jd.is_dir():
        fail("references/司法解释/ 不存在")
        return
    for path in sorted(jd.glob("*.md")):
        text = read_utf8(path)
        if len(text.strip()) < 300:
            fail(f"{path.relative_to(ROOT)}: 内容过短，可能抓取失败")
        if not ARTICLE_RE.search(text):
            fail(f"{path.relative_to(ROOT)}: 未识别到任何条文")


def check_topics() -> None:
    required = [
        "30-关联条文速查.md",
        "40-北京法院实务口径.md",
        "50-证据清单与取证边界.md",
        "60-财产分割计算手册.md",
        "70-抚养权与探望权.md",
        "80-谈判与诉讼流程.md",
        "90-文书模板.md",
        "00-使用说明.md",
    ]
    for name in required:
        if not (REF / name).is_file():
            fail(f"缺少 references/{name}")


def _utf8_stdout() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:  # noqa: BLE001 - best effort only
                pass


def main() -> int:
    _utf8_stdout()
    print("校验 divorce-lawyer skill…")
    skill_text = check_skill_md()
    if skill_text:
        check_reference_paths(skill_text)
    check_statutes()
    check_topics()

    print()
    for w in warnings:
        print(f"  [!] {w}")
    if errors:
        print(f"失败：{len(errors)} 项")
        for e in errors:
            print(f"  [x] {e}")
        return 1
    print("全部检查通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
