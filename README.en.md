# Divorce Lawyer — an AI agent skill

> A plug-in **skill pack** that turns a general-purpose AI agent into a Beijing
> matrimonial lawyer: intakes like a real consultation, answers in a fixed
> six-section format, and cites the actual text of China's Civil Code.

**Language note:** the skill is written in Chinese and targets PRC law
(中华人民共和国民法典, Book V — Marriage and Family). It is not usable for
other jurisdictions.

---

## What it does

- **Triage first.** Ten common opening scenarios (infidelity, domestic violence,
  custody, marital property, bride price, asset concealment, being sued,
  stalling, broken settlement, omitted assets) map to different playbooks.
- **Evidence over opinion.** Every recommendation states what to obtain, how to
  obtain it lawfully, where to keep it, and whether it is admissible.
- **Fixed output shape.** `current position → top risks → do-this-week →
  evidence list → negotiation/litigation strategy → red lines`.
- **Full statute text.** All 1,260 articles of the Civil Code, split by book,
  plus four judicial interpretations — so citations can be checked, not guessed.

## Install

The repository root **is** the skill bundle — `SKILL.md` sits at the top level.
No build step, no dependencies.

### 1. Check the basics

You need `git` (skip to *Without git* below if you don't have it), and you need
to know your agent's skill root. For DeepSeek Harness it is `~/.dsh/skills`
(`%USERPROFILE%\.dsh\skills` on Windows). Create it if missing:

```bash
mkdir -p ~/.dsh/skills
```

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.dsh\skills"
```

### 2. Clone into that root

```bash
git clone https://github.com/<you>/divorce-lawyer.git ~/.dsh/skills/divorce-lawyer
```

```powershell
git clone https://github.com/<you>/divorce-lawyer.git "$env:USERPROFILE\.dsh\skills\divorce-lawyer"
```

### Without git

Download the ZIP from the **Code** button, extract it, rename
`divorce-lawyer-main` to `divorce-lawyer`, and move it into the skill root.

### The layout must end up exactly like this

```
~/.dsh/skills/
└─ divorce-lawyer/
   ├─ SKILL.md          ← at this level, not one deeper
   ├─ references/
   └─ tools/
```

Skill discovery scans **one** directory level. A nested copy
(`.../divorce-lawyer/divorce-lawyer/SKILL.md`) is silently ignored — that is the
most common reason a freshly installed skill does not appear.

### Verify

```bash
ls ~/.dsh/skills/divorce-lawyer/SKILL.md
python3 ~/.dsh/skills/divorce-lawyer/tools/validate.py    # prints all checks passed
```

Or open a fresh agent session and check that `divorce-lawyer` shows up in the
skill list. Sessions that were already open do not re-scan immediately.

### Update / uninstall

```bash
cd ~/.dsh/skills/divorce-lawyer && git pull   # update
rm -rf ~/.dsh/skills/divorce-lawyer           # uninstall
```

### Other frameworks

Any agent that reads a `SKILL.md` (YAML frontmatter + Markdown body) can use it:
drop the folder into that framework's skill directory, keeping the same layout.
If the framework has no resource loading, inline the `SKILL.md` body into the
system prompt and keep `references/` beside it.

## Layout

```
SKILL.md                 persona, triage table, six-section output, red lines
references/民法典/        Civil Code, one file per book (Book V = articles 1040–1118)
references/司法解释/      judicial interpretations (2020, 2025, 2024) + anti-DV law
references/30–90         cross-book provisions, Beijing practice, evidence,
                         calculation formulas, custody, procedure, templates
tools/                   scrapers + repository validator
```

## Sources

| Document | Version | Source |
|---|---|---|
| Civil Code | effective 2021-01-01 | Supreme People's Procuratorate official text |
| Interpretation I | 法释〔2020〕22号 | Supreme People's Court |
| Interpretation II | 法释〔2025〕1号, effective 2025-02-01 | People's Court Daily |
| Bride-price rules | 法释〔2024〕1号 | court system publication |
| Anti-Domestic-Violence Law | effective 2016-03-01 | gov.cn |

Statutory text is reformatted only, never edited. CI asserts the article count
is exactly **1,260**.

## Design notes

- **Statute vs. practice are separated.** Judicial practice notes carry a
  confidence tag — `【明文】` (express provision) · `【主流】` (prevailing
  practice) · `【经验】` (empirical range) · `【待核】` (verify before use).
- **Ranges, not false precision.** Damages, housework compensation and child
  support are given as ranges with a "check local cases" caveat.
- **Common citation errors are corrected.** The 30-day cooling-off period is
  article **1077**, not 1076; article 1091 covers five enumerated fault
  grounds, not "any affair".

## Disclaimer

This is a prompt-and-reference pack for AI agents. It is **not legal advice**
and creates no attorney–client relationship. Real matters require a licensed
lawyer and the case file.

## License

[MIT](LICENSE). Statutory texts are excluded from copyright under Article 5 of
the PRC Copyright Law; no rights are claimed over them.
