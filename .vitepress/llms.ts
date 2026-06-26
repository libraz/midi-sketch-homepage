import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Build-time generator for `llms.txt` (https://llmstxt.org).
 *
 * Walks the curated nav/sidebar structures (the single source of truth for the
 * site's information architecture) and reads each page's frontmatter
 * `description`, emitting a deterministic Markdown index into the build output.
 * The structures are passed in from `config.ts` so the index never drifts from
 * the navigation that ships to readers.
 */

/** A VitePress nav/sidebar node (text + optional link + optional children). */
export type NavNode = {
  text?: string
  link?: string
  items?: NavNode[]
}

/** A flattened, linkable page collected from a nav/sidebar tree. */
type LeafPage = {
  text: string
  link: string
}

export type GenerateLlmsTxtOptions = {
  /** Canonical site origin, e.g. `https://midisketch.libraz.net`. */
  siteUrl: string
  /** Absolute path to the content source directory (`src`). */
  srcDir: string
  /** Absolute path to the build output directory (`.vitepress/dist`). */
  outDir: string
  /** One-line project summary used for the llms.txt blockquote. */
  summary: string
  /** Featured top-level pages (demo / landing), emitted as their own section. */
  highlights: NavNode[]
  /** English docs sidebar groups (`/docs/` sidebar). */
  docsSidebar: NavNode[]
}

/** Collect every leaf (a node carrying a `link`) in document order. */
function collectLeaves(nodes: NavNode[]): LeafPage[] {
  const leaves: LeafPage[] = []
  const walk = (list: NavNode[]) => {
    for (const node of list) {
      if (node.link && node.text) {
        leaves.push({ text: node.text, link: node.link })
      }
      if (node.items) walk(node.items)
    }
  }
  walk(nodes)
  return leaves
}

/** Resolve a site-relative route (`/docs/x`) to its source `.md` file. */
function sourcePathForLink(srcDir: string, link: string): string {
  const route = link.replace(/^\//, '').replace(/\/$/, '')
  return join(srcDir, `${route || 'index'}.md`)
}

/** Read the frontmatter `description:` for a page, or `null` if absent. */
function readDescription(srcDir: string, link: string): string | null {
  const file = sourcePathForLink(srcDir, link)
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf-8')
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) return null
  const line = fm[1].match(/^description:\s*(.+)$/m)
  if (!line) return null
  return line[1].trim().replace(/^["']|["']$/g, '')
}

/** Render one `- [text](url): description` bullet for a leaf page. */
function renderBullet(siteUrl: string, srcDir: string, leaf: LeafPage): string {
  const url = leaf.link === '/' ? `${siteUrl}/` : `${siteUrl}${leaf.link}.html`
  const description = readDescription(srcDir, leaf.link)
  return description ? `- [${leaf.text}](${url}): ${description}` : `- [${leaf.text}](${url})`
}

/** Render an `## H2` section with a bullet list, or an empty string if no leaves. */
function renderSection(
  siteUrl: string,
  srcDir: string,
  heading: string,
  leaves: LeafPage[]
): string {
  if (leaves.length === 0) return ''
  const bullets = leaves.map((leaf) => renderBullet(siteUrl, srcDir, leaf))
  return `## ${heading}\n\n${bullets.join('\n')}\n`
}

/** Build the full llms.txt body. */
export function buildLlmsTxt(options: GenerateLlmsTxtOptions): string {
  const { siteUrl, srcDir, summary, highlights, docsSidebar } = options

  const sections: string[] = [
    '# MIDI Sketch',
    '',
    `> ${summary}`,
    '',
    'MIDI Sketch runs entirely client-side in the browser (WebAssembly) and natively',
    'in Node.js and C++. Unlike AI audio generators, it outputs editable, fully',
    'reproducible MIDI data you can import into any DAW. The links below point to the',
    'canonical HTML documentation. Japanese (日本語) versions live under `/ja/`.',
    ''
  ]

  const featured = renderSection(siteUrl, srcDir, 'Demo', collectLeaves(highlights))
  if (featured) sections.push(featured, '')

  for (const group of docsSidebar) {
    if (!group.text) continue
    const leaves = collectLeaves(group.items ?? [])
    const section = renderSection(siteUrl, srcDir, group.text, leaves)
    if (section) sections.push(section, '')
  }

  sections.push(
    '## Japanese (日本語)',
    '',
    `- [日本語ドキュメント](${siteUrl}/ja/docs/getting-started.html): 同じ内容の日本語版ドキュメント一式`,
    `- [音楽コース](${siteUrl}/ja/docs/course/primer.html): 設定の背景にある音楽理論を学ぶ日本語コース`,
    ''
  )

  return `${sections
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`
}

/** Generate `llms.txt` into the build output directory. */
export function generateLlmsTxt(options: GenerateLlmsTxtOptions): void {
  const body = buildLlmsTxt(options)
  writeFileSync(join(options.outDir, 'llms.txt'), body, 'utf-8')
}
