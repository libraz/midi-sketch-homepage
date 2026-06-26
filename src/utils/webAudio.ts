/**
 * Route Web Audio output to the media-playback audio channel.
 *
 * On iOS Safari, Web Audio defaults to the ringer channel, so the hardware
 * silent switch mutes it entirely. Declaring the audio session as 'playback'
 * (iOS 17+) moves output to the media channel, matching how audio/video
 * elements behave. No-op on other platforms.
 */
export function configureAudioSession(): void {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) {
    try {
      session.type = 'playback'
    } catch {
      // Older iOS versions may reject the value; fall through silently.
    }
  }
}

/** Create an AudioContext routed to the media-playback audio channel. */
export function createAudioContext(): AudioContext {
  configureAudioSession()
  return new AudioContext()
}
