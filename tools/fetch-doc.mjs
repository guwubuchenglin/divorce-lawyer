// Fetch a law / judicial-interpretation page and emit clean Markdown.
// usage: node fetch-doc.mjs <url> <outfile> <title> [sourceNote]
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const [url, outfile, title, note, endArticle] = process.argv.slice(2)
if (!url || !outfile || !title) {
  console.error('usage: node fetch-doc.mjs <url> <outfile> <title> [sourceNote]')
  process.exit(1)
}

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
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
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

const JUNK = /^(打印本页|字号|关闭窗口|分享到|扫一扫|责任编辑|上一篇|下一篇|文章出处|来源：|发布时间|您是第|版权所有|地址：|邮编|备案|关于我们|网站地图|Copyright)/

const res = await fetch(url, {
  headers: {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  },
  redirect: 'follow',
})
if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
const html = Buffer.from(await res.arrayBuffer()).toString('utf8')

const paras = htmlToText(html)
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.length > 0)
  .filter((l) => !JUNK.test(l))

const start = paras.findIndex((p) => /^第[一二三四五六七八九十]+条/.test(p))
if (start < 0) throw new Error('could not locate 第一条 in ' + url)
let body = paras.slice(start).filter((p) => !/^(附：|相关链接|返回顶部)/.test(p))

// Trim trailing page furniture (copyright lines, hashes, counters) without
// risking truncation of a final article that has sub-items.
const TAIL_JUNK =
  /(版权所有|Copyright|您是第|^[0-9a-f]{16,}$|^[|·\s]+$|^责任编辑|^上一篇|^下一篇|^关闭窗口|^打印|ICP备|公网安备|^地址：|^邮编|^总机|^举报电话|^中华人民共和国.*网)/i
while (body.length > 0 && TAIL_JUNK.test(body[body.length - 1])) body.pop()

body = body.map((p) => p.replace(/^(第[零一二三四五六七八九十百千]+条)(?=[^\s])/, '$1 '))

// With an explicit final article, keep it and any following sub-items, then stop.
if (endArticle) {
  const idx = body.findIndex((p) => p.startsWith(endArticle))
  if (idx < 0) throw new Error(`could not locate ${endArticle} in ${url}`)
  let end = idx + 1
  while (end < body.length && /^[（(][一二三四五六七八九十]+[）)]/.test(body[end])) end++
  body = body.slice(0, end)
}



const out = [`# ${title}`, '']
if (note) out.push(`> ${note}`, '')
for (const p of body) {
  out.push(p.replace(/\s+/g, ' '))
  out.push('')
}

const md = out.join('\n').replace(/\n{3,}/g, '\n\n')
await mkdir(dirname(outfile), { recursive: true })
await writeFile(outfile, md, 'utf8')
console.log(JSON.stringify({ outfile, paragraphs: body.length, chars: md.length, first: body[0], last: body.at(-1) }, null, 2))
