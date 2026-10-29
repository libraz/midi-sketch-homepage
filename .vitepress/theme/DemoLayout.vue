<script setup lang="ts">
import MidiStudio from '@/components/studio/MidiStudio.vue'
import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import wasmMeta from '@/wasm/meta.json'
import { useWizardStore } from '@/stores/useWizardStore'
import { useI18n } from '@/composables/useI18n'

const { lang, isDark, theme } = useData()
const store = useWizardStore()
const { t } = useI18n()

// Light/dark theme toggle (shared with the docs site via VitePress appearance)
function toggleTheme() {
  isDark.value = !isDark.value
}

// Beta banner dismiss state
const betaDismissed = ref(false)
function dismissBeta() {
  betaDismissed.value = true
}

// WASM version info
const wasmHash = computed(() => wasmMeta.md5.slice(0, 7))
const wasmBuildDate = computed(() => {
  const d = new Date(wasmMeta.buildDate)
  return lang.value === 'ja'
    ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}版`
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

// Short build-date label shown in the beta banner (e.g. "6月6日版" / "Jun 6 build")
const buildDateLabel = computed(() => {
  const d = new Date(wasmMeta.buildDate)
  return lang.value === 'ja'
    ? `${d.getMonth() + 1}月${d.getDate()}日版`
    : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} build`
})

// Initialize WASM lazily to avoid blocking page render
async function initWasm() {
  if (typeof window === 'undefined') return
  if (store.libVersion.value) return // Already initialized

  try {
    const wasm = await import('@/wasm/index.js')
    const wasmPath = new URL('@/wasm/midisketch.wasm', import.meta.url).href
    await wasm.init({ wasmPath })
    store.libVersion.value = wasm.getVersion()
  } catch (e) {
    console.warn('Failed to initialize WASM:', e)
  }
}

// Defer WASM initialization to after page render
onMounted(() => {
  // Use requestIdleCallback if available (not on iOS Safari), otherwise setTimeout
  const ric = (window as any).requestIdleCallback
  if (ric) {
    ric(initWasm, { timeout: 2000 })
  } else {
    setTimeout(initWasm, 100)
  }
})

// Locale configuration for multi-language support
const locales = {
  en: { label: 'English', shortLabel: 'EN', path: '', docsLabel: 'Docs' },
  ja: { label: '日本語', shortLabel: '日本語', path: '/ja', docsLabel: 'ドキュメント' },
  // Add more locales here: zh: { label: '中文', shortLabel: '中文', path: '/zh', docsLabel: '文档' },
} as const

type LocaleKey = keyof typeof locales
const defaultLocale: LocaleKey = 'en'

// Current locale config
const currentLocale = computed(() => locales[lang.value as LocaleKey] || locales[defaultLocale])

// Build locale-aware path
const localePath = (path: string) => `${currentLocale.value.path}${path}`

// Top-bar links come from the locale's VitePress nav so the studio and the docs
// share one list; GitHub is rendered as an icon button on its own.
const navLinks = computed(() =>
  ((theme.value.nav ?? []) as { text: string; link: string }[])
    .filter(item => item.link?.startsWith('/'))
)

// Available locales for language switcher (excluding current)
const otherLocales = computed(() =>
  Object.entries(locales)
    .filter(([key]) => key !== lang.value)
    .map(([key, config]) => ({ key, ...config }))
)
</script>

<template>
  <div class="demo-page" :class="`demo-page--${lang}`">
    <!-- Ambient Background -->
    <div class="demo-page__backdrop" aria-hidden="true">
      <div class="demo-page__grid"></div>
      <div class="demo-page__orb"></div>
    </div>

    <!-- Beta Banner -->
    <Transition name="beta-banner">
      <div v-if="!betaDismissed" class="beta-banner" role="status">
        <div class="beta-banner__inner">
          <span class="beta-banner__badge">{{ t('betaBanner.badge') }}</span>
          <span class="beta-banner__date" :title="wasmMeta.buildDate">{{ buildDateLabel }}</span>
          <p class="beta-banner__message">{{ t('betaBanner.message') }}</p>
          <a
            href="https://github.com/libraz/midi-sketch/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="beta-banner__cta"
          >
            {{ t('betaBanner.cta') }}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2.5 9.5l7-7M4.5 2.5h5v5" />
            </svg>
          </a>
          <button
            class="beta-banner__dismiss"
            :aria-label="t('betaBanner.dismiss')"
            @click="dismissBeta"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
              <path d="M4 4l6 6M10 4l-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Top bar: brand on the left, site navigation on the right -->
    <header class="demo-topbar">
      <a :href="localePath('/') || '/'" class="demo-topbar__brand">
        <span class="demo-topbar__mark" aria-hidden="true">◈</span>
        <span class="demo-topbar__names">
          <span class="demo-topbar__name">{{ t('wizard.logo') }}</span>
          <span class="demo-topbar__tagline">{{ t('wizard.subtitle') }}</span>
        </span>
      </a>
      <nav class="demo-topbar__nav">
        <a v-for="item in navLinks" :key="item.link" :href="item.link" class="demo-topbar__link">
          {{ item.text }}
        </a>
        <a
          v-for="locale in otherLocales"
          :key="locale.key"
          :href="locale.path || '/'"
          class="demo-topbar__link demo-topbar__link--lang"
          :hreflang="locale.key"
        >
          {{ locale.shortLabel }}
        </a>
        <span class="demo-topbar__sep" aria-hidden="true"></span>
        <button
          class="demo-topbar__icon"
          :aria-label="t('studio.themeToggle')"
          :title="t('studio.themeToggle')"
          @click="toggleTheme"
        >
          <!-- Sun (shown in dark mode → switches to light) -->
          <svg class="demo-topbar__theme-icon demo-topbar__theme-icon--sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <!-- Moon (shown in light mode → switches to dark) -->
          <svg class="demo-topbar__theme-icon demo-topbar__theme-icon--moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        <a
          href="https://github.com/libraz/midi-sketch"
          target="_blank"
          rel="noopener noreferrer"
          class="demo-topbar__icon"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </nav>
    </header>

    <!-- Main Demo Area -->
    <main class="demo-page__main">
      <MidiStudio />
    </main>

    <!-- Minimal Footer -->
    <footer class="demo-page__footer">
      <span class="demo-page__version" :title="`WASM Build: ${wasmMeta.md5}`">
        midi-sketch {{ store.libVersion || wasmMeta.version }} ({{ wasmHash }}) · {{ wasmBuildDate }}
      </span>
    </footer>
  </div>
</template>

<style scoped>

.demo-page {
  --demo-text: rgba(var(--studio-ink-rgb), 0.62);
  --demo-text-muted: rgba(var(--studio-ink-rgb), 0.4);

  min-height: 100vh;
  min-height: 100dvh;
  background: var(--studio-page-bg);
  display: flex;
  overscroll-behavior: none;
  flex-direction: column;
  font-family: var(--font-body);
}

/* Proportional kana spacing: UI labels, not running prose */
.demo-page:lang(ja) {
  font-feature-settings: 'palt';
}

/* Backdrop: a faint grid and a single slow-moving purple wash */
.demo-page__backdrop {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.demo-page__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--studio-purple-rgb), 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--studio-purple-rgb), 0.03) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 70%);
}

.demo-page__orb {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 900px;
  height: 600px;
  margin-left: -450px;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--studio-purple), transparent);
  opacity: calc(var(--studio-orb-opacity) * 0.6);
  filter: blur(80px);
  animation: orb-float 30s ease-in-out infinite;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, 20px) scale(1.06); }
}

/* Beta Banner: in normal flow so it can never cover the top bar */
.beta-banner {
  position: relative;
  z-index: 3;
  background: rgba(var(--studio-orange-rgb), 0.07);
  border-bottom: 1px solid rgba(var(--studio-orange-rgb), 0.15);
  overflow: hidden;
}

.beta-banner__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.45rem 1rem;
  max-width: 1120px;
  margin: 0 auto;
}

.beta-banner__badge {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #050508;
  background: #F59E0B;
  padding: 0.18rem 0.45rem;
  border-radius: 4px;
  line-height: 1;
}

.beta-banner__date {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--studio-amber);
  white-space: nowrap;
  cursor: help;
}

.beta-banner__message {
  margin: 0;
  min-width: 0;
  font-size: 0.76rem;
  color: rgba(var(--studio-ink-rgb), 0.6);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.beta-banner__cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--studio-amber);
  text-decoration: none;
  white-space: nowrap;
  border-radius: 4px;
  padding: 0.15rem 0.35rem;
  margin: -0.15rem 0;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.beta-banner__cta:hover {
  color: var(--studio-orange);
  background: rgba(var(--studio-orange-rgb), 0.1);
}

.dark .beta-banner__cta:hover {
  color: #FDE68A;
}

.beta-banner__dismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(var(--studio-ink-rgb), 0.35);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  padding: 0;
  margin-left: 0.25rem;
}

.beta-banner__dismiss:hover {
  color: rgba(var(--studio-ink-rgb), 0.7);
  background: rgba(var(--studio-ink-rgb), 0.06);
}

.beta-banner-enter-active,
.beta-banner-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
}

.beta-banner-enter-from,
.beta-banner-leave-to {
  opacity: 0;
  max-height: 0;
}

.beta-banner-enter-to,
.beta-banner-leave-from {
  max-height: 120px;
}

/* Top bar */
.demo-topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1rem 1.5rem 0.5rem;
}

.demo-topbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  color: var(--studio-text-primary);
  text-decoration: none;
  border-radius: 8px;
}

.demo-topbar__mark {
  font-size: 1.35rem;
  line-height: 1;
  color: var(--studio-purple);
}

.demo-topbar__names {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.demo-topbar__name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  line-height: 1.2;
  white-space: nowrap;
}

.demo-topbar__tagline {
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--demo-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-topbar__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.demo-topbar__link {
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--demo-text);
  text-decoration: none;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.demo-topbar__link:hover {
  color: var(--studio-text-primary);
  background: rgba(var(--studio-purple-rgb), 0.08);
}

.demo-topbar__link--lang {
  font-weight: 600;
}

.demo-topbar__sep {
  width: 1px;
  height: 18px;
  margin: 0 0.35rem;
  background: rgba(var(--studio-ink-rgb), 0.12);
}

.demo-topbar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--demo-text);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.demo-topbar__icon:hover {
  color: var(--studio-text-primary);
  background: rgba(var(--studio-purple-rgb), 0.08);
}

.demo-topbar__brand:focus-visible,
.demo-topbar__link:focus-visible,
.demo-topbar__icon:focus-visible,
.beta-banner__cta:focus-visible,
.beta-banner__dismiss:focus-visible {
  outline: 2px solid var(--studio-purple);
  outline-offset: 2px;
}

/* Icon visibility follows the html.dark class to avoid hydration mismatch */
.demo-topbar__theme-icon--sun {
  display: none;
}

.dark .demo-topbar__theme-icon--sun {
  display: block;
}

.dark .demo-topbar__theme-icon--moon {
  display: none;
}

/* Main Content */
.demo-page__main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0.75rem 1.5rem 1.5rem;
  position: relative;
  z-index: 1;
  min-height: 0;
}

.demo-page__main :deep(.midi-studio) {
  width: 100%;
  max-width: 1120px;
}

/* Footer */
.demo-page__footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 0.5rem 1.5rem 1.25rem;
}

.demo-page__version {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--demo-text-muted);
  letter-spacing: 0.04em;
  text-align: center;
  cursor: help;
}

/* Hide VitePress chrome */
.demo-page :deep(.VPNav),
.demo-page :deep(.VPNavBar),
.demo-page :deep(.VPSidebar),
.demo-page :deep(.VPFooter),
.demo-page :deep(.VPLocalNav) {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .demo-page__orb {
    animation: none;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .beta-banner__inner {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 0.3rem 0.5rem;
    padding: 0.45rem 0.75rem;
  }

  .beta-banner__message {
    flex: 1 1 100%;
    order: 2;
    font-size: 0.72rem;
    white-space: normal;
  }

  .beta-banner__badge,
  .beta-banner__date {
    order: 1;
  }

  .beta-banner__cta {
    order: 3;
    font-size: 0.72rem;
    margin-left: -0.35rem;
  }

  .beta-banner__dismiss {
    order: 1;
    margin-left: auto;
  }

  .demo-topbar {
    padding: 0.75rem 0.75rem 0.25rem;
  }

  .demo-topbar__tagline {
    display: none;
  }

  .demo-topbar__name {
    font-size: 0.9rem;
    letter-spacing: 0.1em;
  }

  .demo-topbar__link {
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }

  .demo-page__main {
    padding: 0.5rem 0.5rem 1rem;
  }
}

@media (max-width: 420px) {
  /* Docs links stay reachable from the docs pages; keep the bar on one line */
  .demo-topbar__link:not(.demo-topbar__link--lang):not(:first-child) {
    display: none;
  }

  .demo-topbar__sep {
    display: none;
  }
}

</style>
