import { useWizardStore } from '@/stores/useWizardStore'

/**
 * Lazily load the chord progression catalog from WASM into the store.
 * Idempotent: the WASM module is a singleton and the progressions are only
 * fetched once. Used by always-mounted studio controls (e.g. the Essentials
 * chord pill) so a chord name is available before the chord sheet is opened.
 */
let _loading: Promise<void> | null = null

export function useChordCatalog() {
  const store = useWizardStore()

  /**
   * Ensure store.chordProgressions is populated. Safe to call repeatedly.
   */
  async function ensureLoaded(): Promise<void> {
    if (typeof window === 'undefined') return
    if (store.chordProgressions.value.length > 0) return
    if (_loading) return _loading

    _loading = (async () => {
      try {
        const mod = await import('../wasm/index.js')
        const wasmPath = new URL('../wasm/midisketch.wasm', import.meta.url).href
        await mod.init({ wasmPath })
        const chords = mod.getChords() as { name: string; display: string }[]
        store.setChordProgressions(
          chords.map((c, index) => ({ id: index, name: c.name, display: c.display }))
        )
        store.libVersion.value = mod.getVersion()
      } catch {
        // WASM load failed - leave catalog empty; callers fall back gracefully
      } finally {
        _loading = null
      }
    })()

    return _loading
  }

  return { ensureLoaded }
}
