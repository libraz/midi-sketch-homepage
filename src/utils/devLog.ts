/**
 * Development-only logging utility
 * Logs are only output when running in development mode (yarn dev)
 */

const isDev = import.meta.env.DEV

export function devLog(label: string, data?: any) {
  if (isDev) {
    if (data !== undefined) {
      console.log(`[MidiSketch] ${label}`, data)
    } else {
      console.log(`[MidiSketch] ${label}`)
    }
  }
}
