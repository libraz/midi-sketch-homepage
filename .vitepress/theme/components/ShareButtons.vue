<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useWizardStore } from '../stores/useWizardStore'
import { generateShareUrl, type ShareType } from '../utils/shareEncoder'

const props = defineProps<{
  shareType: ShareType
}>()

const { t } = useI18n()
const store = useWizardStore()

const isCopied = ref(false)
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
})

const shareUrl = computed(() => generateShareUrl(store.config, props.shareType))

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
</script>

<template>
  <!-- Copy URL Button (Backup) - Desktop only -->
  <button
    v-if="!isMobile"
    class="backup-btn"
    :class="{ 'backup-btn--copied': isCopied }"
    @click="copyUrl"
    :title="t('share.copyUrl')"
  >
    <span class="backup-btn__icon-wrap">
      <svg v-if="!isCopied" class="backup-btn__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
      </svg>
      <svg v-else class="backup-btn__icon backup-btn__icon--check" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </span>
    <span class="backup-btn__text">
      {{ isCopied ? t('share.copied') : t('share.copyUrl') }}
    </span>
  </button>
</template>

<style scoped>
/* Backup URL Button - Subtle, secondary action */
.backup-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: 'Instrument Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(250, 250, 250, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.backup-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(250, 250, 250, 0.7);
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
