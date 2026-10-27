// Build clean, per-book Markdown of the PRC Civil Code from the SPP (最高人民检察院)
// full-text pages, plus a combined full-text file.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const BASE = 'https://www.spp.gov.cn'
const BOOKS = [
  ['10-民法典-总则编.md', '第一编　总则', '/spp/ssmfdyflvdtpgz/202005/t20200512_478406.shtml'],
  ['11-民法典-物权编.md', '第二编　物权', '/spp/ssmfdyflvdtpgz/202008/t20200831_478410.shtml'],
  ['12-民法典-合同编.md', '第三编　合同', '/spp/ssmfdyflvdtpgz/202008/t20200831_478413.shtml'],
  ['13-民法典-人格权编.md', '第四编　人格权', '/spp/ssmfdyflvdtpgz/202008/t20200831_478416.shtml'],
  ['14-民法典-婚姻家庭编.md', '第五编　婚姻家庭', '/spp/ssmfdyflvdtpgz/202008/t20200831_478417.shtml'],
  ['15-民法典-继承编.md', '第六编　继承', '/spp/ssmfdyflvdtpgz/202008/t20200831_478418.shtml'],
  ['16-民法典-侵权责任编.md', '第七编　侵权责任', '/spp/ssmfdyflvdtpgz/202008/t20200831_478419.shtml'],
]

const OUT_DIR = process.argv[2] || 'references/民法典'

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&hellip;': '…',
  '&middot;': '·',
  '&mdash;': '—',
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&[a-z]+;|&#39;|&ldquo;|&rdquo;|&hellip;|&middot;|&mdash;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
}

function htmlToText(html) {
  let s = html
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<\/(p|div|tr|li|h[1-6]|table|section|article)>/gi, '\n\n')
  s = s.replace(/<[^>]+>/g, '')
  s = decodeEntities(s)
  s = s.replace(/\r\n?/g, '\n')
  s = s.replace(/[\u00a0\u3000]/g, ' ')
  s = s.replace(/[ \t\u200b\ufeff]+/g, ' ')
  return s
}

function cleanParagraphs(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !/^(打印本页|字号|关闭窗口|分享到|扫一扫|责任编辑|上一篇|下一篇)/.test(l))
}

function bodyOf(html) {
  const text = htmlToText(html)
  const start = text.indexOf('【字体')
  const endMark = text.indexOf('责任编辑')
  if (start >= 0 && endMark > start) {
    let body = text.slice(text.indexOf('】', start) + 1, endMark)
    return body
  }
  return text
}

const cn = (x) => /^第[零一二三四五六七八九十百千]+(编|章|节|条)/.test(x)

async function fetchText(url) {
  const res = await fetch(BASE + url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer()).toString('utf8')
}

await mkdir(OUT_DIR, { recursive: true })

let totalArticles = 0
const combined = []
const report = []

for (const [file, title, path] of BOOKS) {
  const html = await fetchText(path)
  const paras = cleanParagraphs(bodyOf(html))

  // Keep only from the book heading onward (drop nav / breadcrumbs residue).
  const startIdx = paras.findIndex((p) => p.replace(/\s/g, '').startsWith(title.replace(/\s/g, '')) || p.replace(/\s/g, '').startsWith('第' + title.slice(1, 2) + '编'))
  const body = startIdx >= 0 ? paras.slice(startIdx) : paras

  const out = []
  out.push(`# 中华人民共和国民法典·${title.replace(/\s+/g, ' ')}`)
  out.push('')
  out.push(`> 依据最高人民检察院官网公布的《中华人民共和国民法典》全文整理，仅调整排版，未改动条文。`)
  out.push('')

  let articles = 0
  for (const p of body) {
    const norm = p.replace(/\s+/g, ' ')
    if (/^第[一二三四五六七八九十]+编/.test(norm)) {
      out.push(`## ${norm}`)
      out.push('')
      continue
    }
    if (/^第[一二三四五六七八九十]+章/.test(norm)) {
      out.push(`### ${norm}`)
      out.push('')
      continue
    }
    if (/^第[一二三四五六七八九十]+节/.test(norm)) {
      out.push(`#### ${norm}`)
      out.push('')
      continue
    }
    if (/^第[零一二三四五六七八九十百千]+条/.test(norm)) articles++
    out.push(norm)
    out.push('')
  }

  const md = out.join('\n').replace(/\n{3,}/g, '\n\n')
  await writeFile(join(OUT_DIR, file), md, 'utf8')
  totalArticles += articles
  report.push({ file, title, paragraphs: body.length, articles, chars: md.length })
  combined.push(md.trim())
}

const full = [
  '# 中华人民共和国民法典（全文）',
  '',
  '> 依据最高人民检察院官网公布的分编全文合并整理，仅调整排版，未改动条文。共七编、1260 条。',
  '',
  combined.join('\n\n---\n\n'),
  '',
].join('\n')
await writeFile(join(OUT_DIR, '17-民法典-全文.md'), full, 'utf8')

console.log(JSON.stringify({ totalArticles, files: report }, null, 2))
