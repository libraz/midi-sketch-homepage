<script setup lang="ts">
import MidiWizard from '@/components/MidiWizard.vue'
import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import wasmMeta from '@/wasm/meta.json'
import { useWizardStore } from '@/stores/useWizardStore'
import { useI18n } from '@/composables/useI18n'

const { lang } = useData()
const store = useWizardStore()
const { t } = useI18n()

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
    <div class="demo-page__backdrop">
      <div class="demo-page__grid"></div>
      <div class="demo-page__orb demo-page__orb--1"></div>
      <div class="demo-page__orb demo-page__orb--2"></div>
      <div class="demo-page__orb demo-page__orb--3"></div>
      <div class="demo-page__noise"></div>
    </div>

    <!-- Beta Banner -->
    <Transition name="beta-banner">
      <div v-if="!betaDismissed" class="beta-banner" role="status">
        <div class="beta-banner__inner">
          <span class="beta-banner__badge">{{ t('betaBanner.badge') }}</span>
          <p class="beta-banner__message">{{ t('betaBanner.message') }}</p>
          <a
            href="https://github.com/libraz/midi-sketch/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="beta-banner__cta"
          >
            {{ t('betaBanner.cta') }}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.5 9.5l7-7M4.5 2.5h5v5" />
            </svg>
          </a>
          <button
            class="beta-banner__dismiss"
            :aria-label="t('betaBanner.dismiss')"
            @click="dismissBeta"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 4l6 6M10 4l-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Main Demo Area -->
    <main class="demo-page__main">
      <MidiWizard />
    </main>

    <!-- Minimal Footer -->
    <footer class="demo-page__footer">
      <div class="demo-page__footer-links">
        <a
          href="https://github.com/libraz/midi-sketch"
          target="_blank"
          rel="noopener noreferrer"
          class="demo-page__link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </a>
        <span class="demo-page__divider">·</span>
        <a :href="localePath('/docs/getting-started')" class="demo-page__link">
          <span>{{ currentLocale.docsLabel }}</span>
        </a>
        <template v-for="locale in otherLocales" :key="locale.key">
          <span class="demo-page__divider">·</span>
          <a :href="locale.path || '/'" class="demo-page__link demo-page__lang-switch">
            <span>{{ locale.shortLabel }}</span>
          </a>
        </template>
      </div>
      <div class="demo-page__footer-version">
        <span class="demo-page__version" :title="`WASM Build: ${wasmMeta.md5}`">
          midi-sketch {{ store.libVersion || '...' }} ({{ wasmHash }}) · {{ wasmBuildDate }}
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Sans:wght@400;500;600;700&display=swap');

.demo-page {
  --demo-bg: #050508;
  --demo-purple: #8B5CF6;
  --demo-pink: #EC4899;
  --demo-cyan: #06B6D4;
  --demo-text: rgba(255, 255, 255, 0.6);
  --demo-text-muted: rgba(255, 255, 255, 0.35);

  min-height: 100vh;
  min-height: 100dvh;
  background: var(--demo-bg);
  display: flex;
  overscroll-behavior: none;
  flex-direction: column;
  font-family: 'Instrument Sans', -apple-system, sans-serif;
}

/* Backdrop Effects */
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
    linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%);
}

.demo-page__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: orb-float 25s ease-in-out infinite;
}

.demo-page__orb--1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--demo-purple) 0%, transparent 60%);
  top: -15%;
  left: 10%;
  animation-delay: 0s;
}

.demo-page__orb--2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--demo-pink) 0%, transparent 60%);
  bottom: -10%;
  right: 5%;
  animation-delay: -8s;
}

.demo-page__orb--3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--demo-cyan) 0%, transparent 60%);
  top: 50%;
  left: -5%;
  opacity: 0.2;
  animation-delay: -16s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(40px, -30px) scale(1.1);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(30px, 40px) scale(1.05);
  }
}

.demo-page__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.025;
  mix-blend-mode: overlay;
}

/* Beta Banner */
.beta-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.beta-banner__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.beta-banner__badge {
  flex-shrink: 0;
  font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #050508;
  background: #F59E0B;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  line-height: 1;
}

.beta-banner__message {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.4;
}

.beta-banner__cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #FBBF24;
  text-decoration: none;
  white-space: nowrap;
  border-radius: 4px;
  padding: 0.15rem 0.35rem;
  margin: -0.15rem 0;
  transition: all 0.2s ease;
}

.beta-banner__cta:hover {
  color: #FDE68A;
  background: rgba(245, 158, 11, 0.1);
}

.beta-banner__dismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  margin-left: 0.25rem;
}

.beta-banner__dismiss:hover {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.06);
}

/* Banner transition */
.beta-banner-enter-active {
  transition: all 0.3s ease-out;
}

.beta-banner-leave-active {
  transition: all 0.25s ease-in;
}

.beta-banner-enter-from,
.beta-banner-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}

.beta-banner-enter-to,
.beta-banner-leave-from {
  max-height: 60px;
}

/* Main Content */
.demo-page__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
  min-height: 0;
}

.demo-page__main :deep(.noir-wizard) {
  width: 100%;
  max-width: 1000px;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.1),
    0 50px 100px -20px rgba(0, 0, 0, 0.7),
    0 30px 60px -30px rgba(139, 92, 246, 0.15);
}

/* Footer */
.demo-page__footer {
  position: relative;
  z-index: 2;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(to top, rgba(5, 5, 8, 0.9), transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.demo-page__footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.demo-page__footer-version {
  display: flex;
  justify-content: center;
}

.demo-page__link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  color: var(--demo-text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.demo-page__link:hover {
  color: var(--demo-text);
  background: rgba(139, 92, 246, 0.1);
}

.demo-page__link svg {
  opacity: 0.7;
}

.demo-page__divider {
  color: var(--demo-text-muted);
  opacity: 0.4;
  user-select: none;
}

.demo-page__lang-switch {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.demo-page__version {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 0.7rem;
  color: var(--demo-text-muted);
  opacity: 0.6;
  letter-spacing: 0.05em;
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

/* Responsive */
@media (max-width: 768px) {
  .beta-banner__inner {
    flex-wrap: wrap;
    gap: 0.35rem 0.5rem;
    padding: 0.45rem 0.75rem;
  }

  .beta-banner__message {
    flex: 1 1 100%;
    order: 2;
    font-size: 0.72rem;
  }

  .beta-banner__badge {
    order: 1;
  }

  .beta-banner__cta {
    order: 3;
    font-size: 0.72rem;
  }

  .beta-banner__dismiss {
    order: 1;
    margin-left: auto;
  }

  .demo-page__main {
    padding: 0.75rem;
    align-items: flex-start;
  }

  .demo-page__main :deep(.noir-wizard) {
    border-radius: 16px;
  }

  .demo-page__footer {
    padding: 0.5rem 1rem;
  }

  .demo-page__link {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
}

</style>
