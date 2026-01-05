import { computed } from 'vue'
import { useData } from 'vitepress'
import en from '../locales/en.json'
import ja from '../locales/ja.json'

type LocaleMessages = typeof en
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`
      : never
    }[keyof T]
  : never

const messages: Record<string, LocaleMessages> = {
  en,
  ja
}

export function useI18n() {
  const { lang } = useData()

  const locale = computed(() => lang.value || 'en')

  const currentMessages = computed(() => messages[locale.value] || messages.en)

  /**
   * Get a translated message by key path
   * @param key - Dot-separated key path (e.g., 'wizard.steps.style')
   * @param params - Optional parameters for interpolation
   * @returns Translated string
   */
  function t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.')
    let result: any = currentMessages.value

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        // Fallback to English if key not found
        result = messages.en
        for (const fallbackKey of keys) {
          if (result && typeof result === 'object' && fallbackKey in result) {
            result = result[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }

    if (typeof result !== 'string') {
      return key
    }

    // Handle parameter interpolation like {style}
    if (params) {
      return result.replace(/\{(\w+)\}/g, (_, paramKey) => params[paramKey] || `{${paramKey}}`)
    }

    return result
  }

  /**
   * Check if current locale matches
   */
  function isLocale(loc: string): boolean {
    return locale.value === loc
  }

  return {
    locale,
    t,
    isLocale,
    messages: currentMessages
  }
}
