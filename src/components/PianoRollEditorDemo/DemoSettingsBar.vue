<script setup lang="ts">
import { DURATION_OPTIONS } from './demoUtils'

defineProps<{
  allowHarmony: boolean
  showSafetyAlways: boolean
  currentDuration: number
}>()

defineEmits<{
  'update:allowHarmony': [value: boolean]
  'update:showSafetyAlways': [value: boolean]
  'update:currentDuration': [value: number]
  clearSection: []
  clearAll: []
}>()
</script>

<template>
  <div class="settings-bar">
    <div class="setting-group">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="allowHarmony"
          @change="$emit('update:allowHarmony', ($event.target as HTMLInputElement).checked)"
        />
        <span>Polyphonic</span>
      </label>
    </div>

    <div class="setting-group">
      <label class="setting-label">
        <input
          type="checkbox"
          :checked="showSafetyAlways"
          @change="$emit('update:showSafetyAlways', ($event.target as HTMLInputElement).checked)"
        />
        <span>Show Safety</span>
      </label>
    </div>

    <div class="setting-group">
      <span class="setting-label">New Note Duration:</span>
      <div class="duration-buttons">
        <button
          v-for="opt in DURATION_OPTIONS"
          :key="opt.value"
          class="duration-btn"
          :class="{ 'duration-btn--active': currentDuration === opt.value }"
          @click="$emit('update:currentDuration', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="setting-group">
      <button class="action-btn action-btn--danger" @click="$emit('clearSection')">
        Clear Section
      </button>
      <button class="action-btn" @click="$emit('clearAll')">
        Clear All
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

.setting-label input[type="checkbox"] {
  accent-color: #8B5CF6;
}

.duration-buttons {
  display: flex;
  gap: 0.2rem;
}

.duration-btn {
  padding: 0.2rem 0.4rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--font-mono);
  font-size: 0.6rem;
  cursor: pointer;
  transition: all 0.15s;
}

.duration-btn:hover {
  background: rgba(139, 92, 246, 0.2);
}

.duration-btn--active {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8B5CF6;
  color: #FAFAFA;
}

.action-btn {
  padding: 0.3rem 0.6rem;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  color: #A78BFA;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(139, 92, 246, 0.25);
}

.action-btn--danger {
  background: rgba(248, 113, 113, 0.15);
  border-color: rgba(248, 113, 113, 0.3);
  color: #F87171;
}

.action-btn--danger:hover {
  background: rgba(248, 113, 113, 0.25);
}

@media (max-width: 640px) {
  .settings-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
