import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Build-time generator for `llms.txt` (https://llmstxt.org).
 *
 * Derives the index from the resolved VitePress nav/sidebar of each locale — the
 * single source of truth for the site's information architecture — and reads
 * each page's frontmatter `description`. The index therefore never drifts from
 * the navigation that ships to readers.
 *
 * One file is emitted per locale: `/llms.txt` for the root locale and
 * `/<prefix>/llms.txt` for every other one.
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

/** The subset of a resolved theme config this generator reads. */
type ThemeConfigLike = {
  nav?: NavNode[]
  sidebar?: Record<string, NavNode[]> | NavNode[]
}

/** The subset of resolved site data this generator reads (`siteConfig.site`). */
export type SiteLike = {
  themeConfig?: ThemeConfigLike
  locales?: Record<string, { themeConfig?: ThemeConfigLike }>
}

/** Prose and routing for one emitted `llms.txt`. */
export type LlmsLocale = {
  /** VitePress locale key (`root`, `ja`, ...). */
  key: string
  /** Route prefix without a trailing slash — `''` for the root locale, `/ja` otherwise. */
  prefix: string
  /** `# Heading` at the top of the file. */
  title: string
  /** One-line summary rendered as the blockquote. */
  summary: string
  /** Prose paragraph rendered under the blockquote. */
  intro: string
  /** Heading for the section listing the landing page and the top-level nav pages. */
  overviewHeading: string
  /** Label for this locale's landing page, which the nav never links to itself. */
  homeText: string
  /** Pointers to the same index in the other languages. */
  alternate?: {
    heading: string
    items: {
      text: string
      /** Route of the sibling index, e.g. `/ja/llms.txt`. */
      link: string
      description: string
    }[]
  }
}

export type GenerateLlmsTxtOptions = {
  /** Canonical site origin, e.g. `https://mygramdb.libraz.net`. */
  siteUrl: string
  /** Absolute path to the content source directory (`src`). */
  srcDir: string
  /** Absolute path to the build output directory (`.vitepress/dist`). */
  outDir: string
  /** Whether the site drops the `.html` extension (`siteConfig.cleanUrls`). */
  cleanUrls?: boolean
  /** Resolved site data — `siteConfig.site` inside `buildEnd`. */
  site: SiteLike
  /** One entry per emitted file, in output order. */
  locales: LlmsLocale[]
}

/** Resolve the theme config that applies to one locale. */
function themeConfigFor(site: SiteLike, key: string): ThemeConfigLike {
  // The root locale inherits the site-level theme config; others define their own.
  const base = key === 'root' ? (site.themeConfig ?? {}) : {}
  return { ...base, ...(site.locales?.[key]?.themeConfig ?? {}) }
}

/** Collect every internal leaf (a node carrying a site-relative `link`) in document order. */
function collectLeaves(nodes: NavNode[]): LeafPage[] {
  const leaves: LeafPage[] = []
  const walk = (list: NavNode[]) => {
    for (const node of list) {
      if (node.link?.startsWith('/') && node.text) {
        leaves.push({ text: node.text, link: node.link })
      }
      if (node.items) walk(node.items)
    }
  }
  walk(nodes)
  return leaves
}

/** Decide whether a multi-sidebar key belongs to the locale owning `prefix`. */
function belongsToLocale(key: string, prefix: string, otherPrefixes: string[]): boolean {
  if (prefix) return key === prefix || key.startsWith(`${prefix}/`)
  return !otherPrefixes.some((other) => key === other || key.startsWith(`${other}/`))
}

/** Flatten a locale's sidebar into groups, following the order the keys are declared in. */
function sidebarGroups(
  theme: ThemeConfigLike,
  prefix: string,
  otherPrefixes: string[]
): NavNode[] {
  const { sidebar } = theme
  if (!sidebar) return []
  if (Array.isArray(sidebar)) return sidebar
  return Object.keys(sidebar)
    .filter((key) => belongsToLocale(key, prefix, otherPrefixes))
    .flatMap((key) => sidebar[key])
}

/** Resolve a site-relative route to its source `.md` file. */
function sourcePathForLink(srcDir: string, link: string): string {
  const route = link.replace(/^\//, '')
  return join(srcDir, route === '' || route.endsWith('/') ? `${route}index.md` : `${route}.md`)
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

/** Build the public URL for a site-relative route. */
function urlForLink(siteUrl: string, link: string, cleanUrls: boolean): string {
  if (link.endsWith('/')) return `${siteUrl}${link}`
  return cleanUrls ? `${siteUrl}${link}` : `${siteUrl}${link}.html`
}

/** Render one `- [text](url): description` bullet for a leaf page. */
function renderBullet(options: GenerateLlmsTxtOptions, leaf: LeafPage): string {
  const url = urlForLink(options.siteUrl, leaf.link, options.cleanUrls ?? false)
  const description = readDescription(options.srcDir, leaf.link)
  return description ? `- [${leaf.text}](${url}): ${description}` : `- [${leaf.text}](${url})`
}

/** Render an `## H2` section with a bullet list, or an empty string if no leaves. */
function renderSection(
  options: GenerateLlmsTxtOptions,
  heading: string,
  leaves: LeafPage[]
): string {
  if (leaves.length === 0) return ''
  const bullets = leaves.map((leaf) => renderBullet(options, leaf))
  return `## ${heading}\n\n${bullets.join('\n')}\n`
}

/** Build the full `llms.txt` body for one locale. */
export function buildLlmsTxt(options: GenerateLlmsTxtOptions, locale: LlmsLocale): string {
  const theme = themeConfigFor(options.site, locale.key)
  const otherPrefixes = options.locales
    .map((entry) => entry.prefix)
    .filter((prefix) => prefix && prefix !== locale.prefix)

  // A page reachable from several sidebars is listed once, at its first appearance.
  const seen = new Set<string>()
  const unseen = (leaves: LeafPage[]) =>
    leaves.filter((leaf) => {
      if (seen.has(leaf.link)) return false
      seen.add(leaf.link)
      return true
    })

  /** Drop repeats within a single list, without touching the cross-group `seen` set. */
  const dedupe = (leaves: LeafPage[]) => {
    const local = new Set<string>()
    return leaves.filter((leaf) => {
      if (local.has(leaf.link)) return false
      local.add(leaf.link)
      return true
    })
  }

  const sections: string[] = [
    `# ${locale.title}`,
    '',
    `> ${locale.summary}`,
    '',
    locale.intro,
    ''
  ]

  const groups = sidebarGroups(theme, locale.prefix, otherPrefixes)
  // The nav is an entry-point list, not part of the tree — it does not consume `seen`,
  // so a page linked from both the nav and a sidebar still appears under its group.
  const overviewSection = renderSection(
    options,
    locale.overviewHeading,
    dedupe([
      { text: locale.homeText, link: `${locale.prefix}/` },
      ...collectLeaves(theme.nav ?? []),
      ...groups.filter((group) => !group.text).flatMap((group) => collectLeaves(group.items ?? []))
    ])
  )
  if (overviewSection) sections.push(overviewSection, '')

  for (const group of groups) {
    if (!group.text) continue
    const section = renderSection(options, group.text, unseen(collectLeaves(group.items ?? [])))
    if (section) sections.push(section, '')
  }

  if (locale.alternate?.items.length) {
    const { heading, items } = locale.alternate
    const bullets = items.map(
      ({ text, link, description }) => `- [${text}](${options.siteUrl}${link}): ${description}`
    )
    sections.push(`## ${heading}`, '', bullets.join('\n'), '')
  }

  return `${sections
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`
}

/** Generate one `llms.txt` per locale into the build output directory. */
export function generateLlmsTxt(options: GenerateLlmsTxtOptions): void {
  for (const locale of options.locales) {
    const file = join(options.outDir, locale.prefix.replace(/^\//, ''), 'llms.txt')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, buildLlmsTxt(options, locale), 'utf-8')
  }
}

/** The slice of VitePress's resolved config the dev middleware needs. */
type ResolvedSiteConfig = {
  srcDir: string
  outDir: string
  cleanUrls?: boolean
  site: SiteLike
}

/** The slice of a Vite dev server the middleware needs, kept structural to avoid a vite import. */
type DevServerLike = {
  config: { vitepress?: ResolvedSiteConfig }
  middlewares: {
    use(
      handler: (
        req: { url?: string },
        res: { setHeader(name: string, value: string): void; end(body: string): void },
        next: () => void
      ) => void
    ): void
  }
}

/**
 * Serve the same indexes from `vitepress dev`.
 *
 * `generateLlmsTxt` runs in `buildEnd`, which a dev server never reaches, so
 * without this the routes 404 until a production build. Register it under
 * `vite.plugins` alongside the `buildEnd` hook; the body is rebuilt per request
 * so edits to page frontmatter show up on reload.
 */
export function llmsDevPlugin(options: Pick<GenerateLlmsTxtOptions, 'siteUrl' | 'locales'>) {
  return {
    name: 'llms-txt-dev',
    apply: 'serve' as const,
    configureServer(server: DevServerLike) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const locale = options.locales.find((entry) => path === `${entry.prefix}/llms.txt`)
        // VitePress attaches its resolved config to the vite config as `vitepress`.
        const siteConfig = server.config.vitepress
        if (!locale || !siteConfig) return next()
        res.setHeader('content-type', 'text/plain; charset=utf-8')
        res.end(
          buildLlmsTxt(
            {
              siteUrl: options.siteUrl,
              srcDir: siteConfig.srcDir,
              outDir: siteConfig.outDir,
              cleanUrls: siteConfig.cleanUrls,
              site: siteConfig.site,
              locales: options.locales
            },
            locale
          )
        )
      })
    }
  }
}
