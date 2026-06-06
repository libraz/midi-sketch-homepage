import { ref } from 'vue'
import { Soundfont } from 'smplr'
import type { ScoreExampleDef, StaffNote } from '@/data/scoreExamples/types'
import { durationBeats } from '@/data/scoreExamples/types'
import { staffKeyToMidi } from '@/utils/midiUtils'

/**
 * Lightweight shared player for course score examples.
 *
 * One AudioContext and one piano instance are shared across all
 * ScoreExample components on a page; starting an example stops
 * whatever other example is sounding. While an example plays, the
 * per-note timing windows are exposed so the score component can
 * highlight the sounding notes in real time.
 */

const BPM = 92
const SECONDS_PER_BEAT = 60 / BPM
/** Gap between the two staves in sequential playback. */
const SEQUENTIAL_GAP_SECONDS = 0.6
const VELOCITY = 92

let audioContext: AudioContext | null = null
let instrument: Soundfont | null = null
let loadPromise: Promise<Soundfont> | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null
// Stop functions returned by smplr start(). Since smplr 0.26 instrument.stop()
// only kills active voices; queued future notes must be cancelled individually.
let scheduledNoteStops: ((time?: number) => void)[] = []

const isLoading = ref(false)
/** Id of the example currently sounding (empty string when silent). */
const playingId = ref('')

/** Which stave a highlight window belongs to. */
export type VoicePart = 'upper' | 'middle' | 'lower'

/** Timing window of one written note, in seconds relative to `startTime`. */
export interface HighlightWindow {
  part: VoicePart
  /** Index into the example's note array for that part. */
  index: number
  start: number
  end: number
}

interface PlaybackState {
  id: string
  /** AudioContext time at which beat 0 sounds. */
  startTime: number
  windows: HighlightWindow[]
}

/** Live playback timing, or null when silent. */
const playbackState = ref<PlaybackState | null>(null)

/** Current AudioContext clock (seconds); 0 when no context exists. */
function audioNow(): number {
  return audioContext?.currentTime ?? 0
}

async function loadInstrument(): Promise<Soundfont> {
  if (instrument) return instrument
  if (!loadPromise) {
    loadPromise = (async () => {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContext()
      }
      const sf = await new Soundfont(audioContext, { instrument: 'acoustic_grand_piano' }).load
      instrument = sf
      return sf
    })()
  }
  return loadPromise
}

interface ScheduledNote {
  midi: number
  startBeat: number
  beats: number
}

interface VoiceSchedule {
  /** Audio events; chords contribute one event per pitch. */
  audio: ScheduledNote[]
  /** One highlight window per written (non-rest) note. */
  windows: HighlightWindow[]
}

function scheduleVoice(notes: StaffNote[], part: VoicePart, offsetBeats: number): VoiceSchedule {
  const audio: ScheduledNote[] = []
  const windows: HighlightWindow[] = []
  let beat = offsetBeats
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const beats = durationBeats(note.duration)
    if (!note.rest) {
      if (note.keys) {
        // Chord: one audio event per pitch, no tie merging.
        for (let k = 0; k < note.keys.length; k++) {
          const midi = staffKeyToMidi(note.keys[k], note.accidentals?.[k] ?? undefined)
          if (midi !== null) audio.push({ midi, startBeat: beat, beats })
        }
        windows.push({
          part,
          index: i,
          start: beat * SECONDS_PER_BEAT,
          end: (beat + beats) * SECONDS_PER_BEAT,
        })
        beat += beats
        continue
      }
      const midi = staffKeyToMidi(note.key, note.accidental)
      if (midi !== null) {
        // Merge a tie chain into one audio event spanning all tied notes.
        let totalBeats = beats
        let j = i
        let chainBeat = beat + beats
        while (notes[j]?.tie && notes[j + 1] && !notes[j + 1].rest && !notes[j + 1].keys) {
          const nextBeats = durationBeats(notes[j + 1].duration)
          windows.push({
            part,
            index: j + 1,
            start: chainBeat * SECONDS_PER_BEAT,
            end: (chainBeat + nextBeats) * SECONDS_PER_BEAT,
          })
          totalBeats += nextBeats
          chainBeat += nextBeats
          j++
        }
        audio.push({ midi, startBeat: beat, beats: totalBeats })
        windows.push({
          part,
          index: i,
          start: beat * SECONDS_PER_BEAT,
          end: (beat + beats) * SECONDS_PER_BEAT,
        })
        beat += totalBeats
        i = j
        continue
      }
    }
    beat += beats
  }
  return { audio, windows }
}

export function useScorePlayer() {
  function stop() {
    playingId.value = ''
    playbackState.value = null
    if (stopTimer) {
      clearTimeout(stopTimer)
      stopTimer = null
    }
    // Cancel queued (not-yet-dispatched) note events first
    for (const stopFn of scheduledNoteStops) {
      stopFn()
    }
    scheduledNoteStops = []
    if (instrument) {
      try {
        instrument.stop()
      } catch {
        // Ignore: the instrument may already be silent.
      }
    }
  }

  async function play(id: string, example: ScoreExampleDef) {
    // Toggle off when the same example is already sounding.
    if (playingId.value === id) {
      stop()
      return
    }
    stop()

    // Create/resume the AudioContext inside the user gesture.
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContext()
      instrument = null
      loadPromise = null
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    isLoading.value = true
    let sf: Soundfont
    try {
      sf = await loadInstrument()
    } finally {
      isLoading.value = false
    }

    const upper = scheduleVoice(example.upper, 'upper', 0)
    const middle = example.middle ? scheduleVoice(example.middle, 'middle', 0) : null
    let lower: VoiceSchedule | null = null
    if (example.lower) {
      let lowerOffset = 0
      if (example.playback === 'sequential') {
        const upperEnd = upper.audio.reduce((max, n) => Math.max(max, n.startBeat + n.beats), 0)
        lowerOffset = upperEnd + SEQUENTIAL_GAP_SECONDS / SECONDS_PER_BEAT
      }
      lower = scheduleVoice(example.lower, 'lower', lowerOffset)
    }
    const all = [...upper.audio, ...(middle?.audio ?? []), ...(lower?.audio ?? [])]
    if (all.length === 0) return

    const now = audioContext.currentTime + 0.05
    for (const note of all) {
      scheduledNoteStops.push(sf.start({
        note: note.midi,
        velocity: VELOCITY,
        time: now + note.startBeat * SECONDS_PER_BEAT,
        duration: note.beats * SECONDS_PER_BEAT * 0.95,
      }))
    }

    playingId.value = id
    playbackState.value = {
      id,
      startTime: now,
      windows: [...upper.windows, ...(middle?.windows ?? []), ...(lower?.windows ?? [])],
    }
    const totalBeats = all.reduce((max, n) => Math.max(max, n.startBeat + n.beats), 0)
    stopTimer = setTimeout(() => {
      if (playingId.value === id) stop()
    }, totalBeats * SECONDS_PER_BEAT * 1000 + 400)
  }

  return { play, stop, isLoading, playingId, playbackState, audioNow }
}
