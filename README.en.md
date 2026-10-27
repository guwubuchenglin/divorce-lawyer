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

The repository root **is** the skill bundle (`SKILL.md` sits at the top).

```bash
git clone https://github.com/<you>/divorce-lawyer.git ~/.dsh/skills/divorce-lawyer
```

Windows PowerShell:

```powershell
git clone https://github.com/<you>/divorce-lawyer.git "$env:USERPROFILE\.dsh\skills\divorce-lawyer"
```

Any framework that reads a `SKILL.md` (YAML frontmatter + Markdown body) can
consume it: drop the folder into that framework's skill directory, or fold the
`SKILL.md` body into the system prompt and keep `references/` alongside it.

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
