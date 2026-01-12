import { ref, provide, inject, type InjectionKey, type Ref } from 'vue'

export type RackModuleId = 'track' | 'instruments' | 'melody' | 'harmony' | 'output'

export interface RackStatusContext {
  message: Ref<string>
  activeModule: Ref<RackModuleId | null>
  setStatus: (module: RackModuleId, text: string) => void
  clearStatus: () => void
}

export const RACK_STATUS_KEY: InjectionKey<RackStatusContext> = Symbol('rack-status')

export function provideRackStatus() {
  const message = ref('')
  const activeModule = ref<RackModuleId | null>(null)

  function setStatus(module: RackModuleId, text: string) {
    message.value = text
    activeModule.value = module
  }

  function clearStatus() {
    message.value = ''
    activeModule.value = null
  }

  const context: RackStatusContext = {
    message,
    activeModule,
    setStatus,
    clearStatus
  }

  provide(RACK_STATUS_KEY, context)
  return context
}

export function useRackStatus() {
  const context = inject(RACK_STATUS_KEY)
  if (!context) {
    throw new Error('useRackStatus must be used within a component that calls provideRackStatus')
  }
  return context
}
