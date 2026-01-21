import { ref } from 'vue'
import { Soundfont, DrumMachine } from 'smplr'
import { Mp3Encoder } from '@breezystack/lamejs'

// GM drum note number to Roland CR-8000 sample name mapping
const GM_TO_DRUM: Record<number, string> = {
  35: 'kick',
  36: 'kick',
  37: 'rimshot',
  38: 'snare',
  39: 'clap',
  40: 'snare',
  41: 'tom-low',
  42: 'hihat-closed',
  43: 'tom-low',
  44: 'hihat-closed',
  45: 'tom-low',
  46: 'hihat-open',
  47: 'tom-low',
  48: 'tom-high',
  49: 'cymball',
  50: 'tom-high',
  51: 'cymball',
  52: 'cymball',
  53: 'cymball',
  54: 'clave',
  55: 'cymball',
  56: 'cowbell',
  57: 'cymball',
  60: 'conga-high',
  61: 'conga-low',
  62: 'conga-high',
  63: 'conga-high',
  64: 'conga-low',
  75: 'clave',
}

interface MidiNote {
  note?: number
  pitch?: number
  start?: number
  start_ticks?: number
  duration?: number
  duration_ticks?: number
  velocity: number
}

interface EventData {
  bpm: number
  ppq: number
  tracks: {
    name: string
    notes: MidiNote[]
  }[]
  sections?: {
    start_ticks?: number
    end_ticks?: number
  }[]
}

function getNoteValue(note: MidiNote, key: 'pitch' | 'start' | 'duration'): number {
  if (key === 'pitch') return note.pitch ?? note.note ?? 60
  if (key === 'start') return note.start_ticks ?? note.start ?? 0
  if (key === 'duration') return note.duration_ticks ?? note.duration ?? 480
  return 0
}

export interface ExportOptions {
  /** Bitrate for MP3 encoding (default: 192) */
  bitrate?: number
  /** Track mute settings */
  mutedTracks?: Record<string, boolean>
  /** Chord track instrument */
  chordInstrument?: 'piano' | 'guitar'
}

export type ExportStatus =
  | 'idle'
  | 'loading-instruments'
  | 'scheduling'
  | 'rendering'
  | 'encoding'
  | 'done'

export function useAudioExport() {
  const isExporting = ref(false)
  const exportStatus = ref<ExportStatus>('idle')
  const exportError = ref<string | null>(null)

  /**
   * Export event data to MP3
   */
  async function exportToMp3(
    eventData: EventData,
    filename: string = 'output.mp3',
    options: ExportOptions = {}
  ): Promise<void> {
    const { bitrate = 192, mutedTracks = { SE: true }, chordInstrument = 'piano' } = options

    isExporting.value = true
    exportStatus.value = 'loading-instruments'
    exportError.value = null

    try {
      const bpm = eventData.bpm || 120
      const ppq = eventData.ppq || 480
      const sampleRate = 44100

      // Calculate total duration
      let maxTick = 0
      if (eventData.sections && eventData.sections.length > 0) {
        const lastSection = eventData.sections[eventData.sections.length - 1]
        maxTick = lastSection.end_ticks ?? 0
      }
      if (maxTick === 0) {
        for (const track of eventData.tracks) {
          for (const note of track.notes) {
            const endTick = getNoteValue(note, 'start') + getNoteValue(note, 'duration')
            if (endTick > maxTick) maxTick = endTick
          }
        }
      }

      const ticksToSeconds = (ticks: number): number => (ticks / ppq) * (60 / bpm)
      const totalDuration = ticksToSeconds(maxTick) + 1 // Add 1 second for reverb tail

      // Create offline audio context
      const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate)

      // Load instruments with scheduler disabled for offline rendering
      const [piano, guitar, pad, drums] = await Promise.all([
        new Soundfont(offlineCtx as unknown as AudioContext, {
          instrument: 'acoustic_grand_piano',
          disableScheduler: true,
        }).load,
        new Soundfont(offlineCtx as unknown as AudioContext, {
          instrument: 'distortion_guitar',
          disableScheduler: true,
        }).load,
        new Soundfont(offlineCtx as unknown as AudioContext, {
          instrument: 'pad_2_warm',
          disableScheduler: true,
        }).load,
        new DrumMachine(offlineCtx as unknown as AudioContext, {
          instrument: 'Roland CR-8000',
          disableScheduler: true,
        }).load,
      ])

      exportStatus.value = 'scheduling'

      // Schedule all notes
      let noteCount = 0
      for (const track of eventData.tracks) {
        if (mutedTracks[track.name]) continue

        const isDrumTrack = track.name === 'Drums'
        const notes = track.notes || []

        for (const note of notes) {
          const noteNum = getNoteValue(note, 'pitch')
          const startTicks = getNoteValue(note, 'start')
          const durationTicks = getNoteValue(note, 'duration')

          const startSeconds = ticksToSeconds(startTicks)
          const durationSeconds = ticksToSeconds(durationTicks)

          if (isDrumTrack) {
            const drumSample = GM_TO_DRUM[noteNum]
            if (drumSample) {
              drums.start({
                note: drumSample,
                velocity: note.velocity,
                time: startSeconds,
                duration: durationSeconds,
              })
            }
          } else {
            let instrument = piano
            if (track.name === 'Aux') {
              instrument = pad
            } else if (track.name === 'Chord' && chordInstrument === 'guitar') {
              instrument = guitar
            }

            instrument.start({
              note: noteNum,
              velocity: note.velocity,
              time: startSeconds,
              duration: durationSeconds,
            })
          }
          noteCount++
        }
      }

      exportStatus.value = 'rendering'

      // Render audio
      const renderPromise = offlineCtx.startRendering()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Render timeout after 120s')), 120000)
      })

      const audioBuffer = await Promise.race([renderPromise, timeoutPromise])

      exportStatus.value = 'encoding'

      // Encode to MP3
      const mp3Data = encodeToMp3(audioBuffer, bitrate)

      // Download
      downloadBlob(mp3Data, filename, 'audio/mp3')

      exportStatus.value = 'done'
    } catch (e: any) {
      exportError.value = e.message
      throw e
    } finally {
      isExporting.value = false
      exportStatus.value = 'idle'
    }
  }

  /**
   * Encode AudioBuffer to MP3 using lamejs
   */
  function encodeToMp3(audioBuffer: AudioBuffer, bitrate: number): Blob {
    const sampleRate = audioBuffer.sampleRate
    const numChannels = audioBuffer.numberOfChannels
    const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitrate)

    const left = audioBuffer.getChannelData(0)
    const right = numChannels > 1 ? audioBuffer.getChannelData(1) : left

    // Convert Float32Array to Int16Array
    const leftInt16 = floatTo16BitPCM(left)
    const rightInt16 = floatTo16BitPCM(right)

    const mp3Data: BlobPart[] = []
    const sampleBlockSize = 1152

    for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize)
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize)

      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf))
      }
    }

    const mp3buf = mp3encoder.flush()
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf))
    }

    return new Blob(mp3Data, { type: 'audio/mp3' })
  }

  /**
   * Convert Float32Array to Int16Array
   */
  function floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return output
  }

  /**
   * Download blob as file
   */
  function downloadBlob(blob: Blob, filename: string, mimeType: string): void {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return {
    isExporting,
    exportStatus,
    exportError,
    exportToMp3,
  }
}
