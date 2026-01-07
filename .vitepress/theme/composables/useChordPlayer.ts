import { ref, onUnmounted } from 'vue'
import * as Tone from 'tone'

// Degree to semitone interval mapping
const degreeToSemitone: Record<string, number> = {
  'I': 0, 'II': 2, 'III': 4, 'IV': 5, 'V': 7, 'VI': 9, 'VII': 11,
  'i': 0, 'ii': 2, 'iii': 4, 'iv': 5, 'v': 7, 'vi': 9, 'vii': 10,
  'bII': 1, 'bIII': 3, 'bVI': 8, 'bVII': 10,
  '#IV': 6, '#iv': 6
}

// Check if degree is minor
function isMinor(degree: string): boolean {
  const baseDegree = degree.replace(/maj7|7|dim|aug/g, '')
  return baseDegree === baseDegree.toLowerCase() && !baseDegree.startsWith('b') && !baseDegree.startsWith('#')
}

// Convert degree to MIDI notes for a chord
function degreeToNotes(degree: string, rootKey: number): number[] {
  const baseDegree = degree.replace(/maj7|7|dim|aug/g, '').toUpperCase()
  const suffix = degree.replace(/[IVivb#]+/g, '')

  const interval = degreeToSemitone[baseDegree] ?? degreeToSemitone[baseDegree.toLowerCase()] ?? 0
  const rootNote = 48 + rootKey + interval // C3 = 48

  const minor = isMinor(degree)

  // Build chord notes
  const notes: number[] = [rootNote]

  if (minor) {
    notes.push(rootNote + 3) // minor 3rd
  } else {
    notes.push(rootNote + 4) // major 3rd
  }
  notes.push(rootNote + 7) // 5th

  // Add 7th if specified
  if (suffix.includes('maj7')) {
    notes.push(rootNote + 11) // major 7th
  } else if (suffix.includes('7')) {
    notes.push(rootNote + 10) // minor 7th
  }

  return notes
}

// Convert MIDI note to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// Parse chord progression display string
function parseProgression(display: string): string[] {
  return display.split(/\s*-\s*/).map(s => s.trim())
}

let synth: Tone.PolySynth | null = null
let currentSequence: Tone.Part | null = null
let isWarmedUp = false

// Warmup function - call on first user interaction to prevent latency
export async function warmupChordPlayer() {
  if (isWarmedUp) return

  try {
    await Tone.start()

    if (!synth) {
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 0.8
        }
      }).toDestination()

      synth.volume.value = -12
    }

    isWarmedUp = true
  } catch (e) {
    console.warn('Failed to warmup chord player:', e)
  }
}

export function useChordPlayer() {
  const isPlaying = ref(false)
  const currentChordIndex = ref(-1)

  async function initSynth() {
    if (synth) return synth

    await Tone.start()

    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination()

    synth.volume.value = -12
    isWarmedUp = true

    return synth
  }

  async function playChord(degree: string, key: number) {
    const s = await initSynth()
    const notes = degreeToNotes(degree, key)
    const freqs = notes.map(midiToFreq)
    s.triggerAttackRelease(freqs, 0.4)
  }

  async function playProgression(display: string, key: number, bpm: number = 120) {
    if (isPlaying.value) {
      stop()
      return
    }

    const s = await initSynth()
    const degrees = parseProgression(display)

    // Set tempo for preview
    const previewBpm = 120
    Tone.getTransport().bpm.value = previewBpm

    // Calculate time per chord in seconds
    const secondsPerChord = 60 / previewBpm

    const events = degrees.map((degree, index) => ({
      time: index * secondsPerChord,
      degree,
      index
    }))

    currentSequence = new Tone.Part((time, event) => {
      const notes = degreeToNotes(event.degree, key)
      const freqs = notes.map(midiToFreq)

      currentChordIndex.value = event.index
      s.triggerAttackRelease(freqs, secondsPerChord * 0.9, time)
    }, events)

    currentSequence.start(0)
    currentSequence.loop = false

    Tone.getTransport().start()
    isPlaying.value = true

    // Stop after progression ends
    const totalDuration = degrees.length * secondsPerChord * 1000
    setTimeout(() => {
      stop()
    }, totalDuration + 200)
  }

  function stop() {
    if (currentSequence) {
      currentSequence.stop()
      currentSequence.dispose()
      currentSequence = null
    }
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    isPlaying.value = false
    currentChordIndex.value = -1
  }

  onUnmounted(() => {
    stop()
    if (synth) {
      synth.dispose()
      synth = null
    }
  })

  return {
    isPlaying,
    currentChordIndex,
    playChord,
    playProgression,
    stop
  }
}
