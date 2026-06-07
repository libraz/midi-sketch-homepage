<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import GenreSelect from './essentials/GenreSelect.vue'
import KeyControl from './essentials/KeyControl.vue'
import BpmControlCompact from './essentials/BpmControlCompact.vue'
import ChordControl from './essentials/ChordControl.vue'
import StudioApplyButton from './StudioApplyButton.vue'

const { t } = useI18n()
</script>

<template>
  <section class="studio-essentials" :aria-label="t('studio.essentials.title')">
    <div class="studio-essentials__grid">
      <GenreSelect class="studio-essentials__cell" />
      <ChordControl class="studio-essentials__cell" />
      <KeyControl class="studio-essentials__cell" />
      <BpmControlCompact class="studio-essentials__cell" />
    </div>

    <div class="studio-essentials__apply">
      <StudioApplyButton />
    </div>
  </section>
</template>

<style scoped>
.studio-essentials {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(var(--studio-panel-rgb), 0.35);
  border: 1px solid rgba(var(--studio-purple-rgb), 0.1);
  border-radius: 16px;
}

.studio-essentials__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.625rem;
}

.studio-essentials__apply {
  display: flex;
}

/* Tablet: 2x2 */
@media (max-width: 860px) {
  .studio-essentials__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile: single column */
@media (max-width: 480px) {
  .studio-essentials__grid {
    grid-template-columns: 1fr;
  }
}
</style>
