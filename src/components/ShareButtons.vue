<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useWizardStore } from '@/stores/useWizardStore'
import { generateShareUrl, type ShareType } from '@/utils/shareEncoder'

const props = defineProps<{
  shareType: ShareType
}>()

const { t } = useI18n()
const store = useWizardStore()

const isCopied = ref(false)
const isMobile = ref(false)
const urlInputRef = ref<HTMLInputElement | null>(null)
const isSelected = ref(false)

onMounted(() => {
  isMobile.value = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
})

const shareUrl = computed(() => {
  return generateShareUrl(store.config, props.shareType)
})

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (e) {
    console.error('Failed to copy URL:', e)
  }
}

function selectUrl() {
  if (urlInputRef.value) {
    urlInputRef.value.select()
    urlInputRef.value.setSelectionRange(0, 99999) // For mobile
    isSelected.value = true
    setTimeout(() => {
      isSelected.value = false
    }, 2000)
  }
}
</script>

<template>
  <!-- Mobile: Terminal-style URL display -->
  <div v-if="isMobile" class="share-terminal">
    <div class="terminal-header">
      <div class="terminal-dots">
        <span class="dot dot--red"></span>
        <span class="dot dot--yellow"></span>
        <span class="dot dot--green"></span>
      </div>
      <span class="terminal-label">SHARE URL</span>
      <div class="terminal-status" :class="{ 'terminal-status--active': isSelected }">
        <span class="status-dot"></span>
        {{ isSelected ? 'SELECTED' : 'READY' }}
      </div>
    </div>
    <div class="terminal-body">
      <div class="terminal-prompt">
        <span class="prompt-symbol">›</span>
        <input
          ref="urlInputRef"
          type="text"
          :value="shareUrl"
          readonly
          class="terminal-input"
          @click="selectUrl"
          @focus="selectUrl"
        />
      </div>
      <div class="terminal-hint">
        <svg class="hint-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/>
        </svg>
        <span>{{ t('share.tapToSelect') }}</span>
      </div>
    </div>
    <div class="terminal-scanline"></div>
  </div>

  <!-- Desktop: Copy URL Button -->
  <button
    v-else
    class="backup-btn"
    :class="{ 'backup-btn--copied': isCopied }"
    @click="copyUrl"
    :title="t('share.copyUrl')"
  >
    <span class="backup-btn__icon-wrap">
      <svg v-if="!isCopied" class="backup-btn__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
      </svg>
      <svg v-else class="backup-btn__icon backup-btn__icon--check" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </span>
    <span class="backup-btn__text">
      {{ isCopied ? t('share.copied') : t('share.copyUrl') }}
    </span>
  </button>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   MOBILE TERMINAL - Futuristic console aesthetic
   ═══════════════════════════════════════════════════════════════ */

.share-terminal {
  position: relative;
  background: linear-gradient(180deg, rgba(10, 10, 16, 0.95) 0%, rgba(6, 6, 10, 0.98) 100%);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Instrument Sans', sans-serif;
}

.share-terminal::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

/* Terminal Header */
.terminal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.terminal-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.7;
}

.dot--red { background: #ff5f57; }
.dot--yellow { background: #febc2e; }
.dot--green { background: #28c840; }

.terminal-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(250, 250, 250, 0.4);
  text-transform: uppercase;
}

.terminal-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(250, 250, 250, 0.35);
  transition: color 0.3s ease;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(250, 250, 250, 0.25);
  transition: all 0.3s ease;
}

.terminal-status--active {
  color: #34D399;
}

.terminal-status--active .status-dot {
  background: #34D399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}

/* Terminal Body */
.terminal-body {
  padding: 0.75rem;
}

.terminal-prompt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prompt-symbol {
  color: #8B5CF6;
  font-size: 1rem;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  animation: prompt-pulse 2s ease-in-out infinite;
}

@keyframes prompt-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.72rem;
  color: rgba(250, 250, 250, 0.85);
  letter-spacing: -0.01em;
  padding: 0.5rem 0;
  cursor: text;
  -webkit-user-select: all;
  user-select: all;
}

.terminal-input::selection {
  background: rgba(139, 92, 246, 0.4);
  color: #FAFAFA;
}

.terminal-input:focus {
  color: #FAFAFA;
}

/* Hint */
.terminal-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.625rem;
  padding-top: 0.625rem;
  border-top: 1px solid rgba(139, 92, 246, 0.08);
  font-size: 0.65rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.3);
  letter-spacing: 0.02em;
}

.hint-icon {
  opacity: 0.5;
}

/* Scanline Effect */
.terminal-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP BACKUP BUTTON
   ═══════════════════════════════════════════════════════════════ */

.backup-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(250, 250, 250, 0.6);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.backup-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(250, 250, 250, 0.8);
  transform: translateY(-2px);
}

.backup-btn__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.backup-btn__icon {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.backup-btn:hover .backup-btn__icon {
  opacity: 0.8;
}

.backup-btn__text {
  white-space: nowrap;
}

/* Copied State */
.backup-btn--copied {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  color: #34D399;
}

.backup-btn--copied .backup-btn__icon {
  opacity: 1;
}

.backup-btn--copied .backup-btn__icon--check {
  animation: checkPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes checkPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
