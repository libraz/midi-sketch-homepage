import { Soundfont, DrumMachine } from 'smplr'

// GM drum note number to Roland CR-8000 sample name mapping
export const GM_TO_DRUM: Record<number, string> = {
  35: 'kick',         // Acoustic Bass Drum
  36: 'kick',         // Bass Drum 1
  37: 'rimshot',      // Side Stick
  38: 'snare',        // Acoustic Snare
  39: 'clap',         // Hand Clap
  40: 'snare',        // Electric Snare
  41: 'tom-low',      // Low Floor Tom
  42: 'hihat-closed', // Closed Hi-Hat
  43: 'tom-low',      // High Floor Tom
  44: 'hihat-closed', // Pedal Hi-Hat
  45: 'tom-low',      // Low Tom
  46: 'hihat-open',   // Open Hi-Hat
  47: 'tom-low',      // Low-Mid Tom
  48: 'tom-high',     // Hi-Mid Tom
  49: 'cymball',      // Crash Cymbal 1
  50: 'tom-high',     // High Tom
  51: 'cymball',      // Ride Cymbal 1
  52: 'cymball',      // Chinese Cymbal
  53: 'cymball',      // Ride Bell
  54: 'clave',        // Tambourine -> clave
  55: 'cymball',      // Splash Cymbal
  56: 'cowbell',      // Cowbell
  57: 'cymball',      // Crash Cymbal 2
  60: 'conga-high',   // Hi Bongo
  61: 'conga-low',    // Low Bongo
  62: 'conga-high',   // Mute Hi Conga
  63: 'conga-high',   // Open Hi Conga
  64: 'conga-low',    // Low Conga
  75: 'clave',        // Claves
}

// GM program number (0-127) to smplr instrument name
// Full General MIDI Level 1 instrument list
const GM_INSTRUMENTS: string[] = [
  // Piano (0-7)
  'acoustic_grand_piano',
  'bright_acoustic_piano',
  'electric_grand_piano',
  'honkytonk_piano',
  'electric_piano_1',
  'electric_piano_2',
  'harpsichord',
  'clavinet',
  // Chromatic Percussion (8-15)
  'celesta',
  'glockenspiel',
  'music_box',
  'vibraphone',
  'marimba',
  'xylophone',
  'tubular_bells',
  'dulcimer',
  // Organ (16-23)
  'drawbar_organ',
  'percussive_organ',
  'rock_organ',
  'church_organ',
  'reed_organ',
  'accordion',
  'harmonica',
  'tango_accordion',
  // Guitar (24-31)
  'acoustic_guitar_nylon',
  'acoustic_guitar_steel',
  'electric_guitar_jazz',
  'electric_guitar_clean',
  'electric_guitar_muted',
  'overdriven_guitar',
  'distortion_guitar',
  'guitar_harmonics',
  // Bass (32-39)
  'acoustic_bass',
  'electric_bass_finger',
  'electric_bass_pick',
  'fretless_bass',
  'slap_bass_1',
  'slap_bass_2',
  'synth_bass_1',
  'synth_bass_2',
  // Strings (40-47)
  'violin',
  'viola',
  'cello',
  'contrabass',
  'tremolo_strings',
  'pizzicato_strings',
  'orchestral_harp',
  'timpani',
  // Ensemble (48-55)
  'string_ensemble_1',
  'string_ensemble_2',
  'synth_strings_1',
  'synth_strings_2',
  'choir_aahs',
  'voice_oohs',
  'synth_choir',
  'orchestra_hit',
  // Brass (56-63)
  'trumpet',
  'trombone',
  'tuba',
  'muted_trumpet',
  'french_horn',
  'brass_section',
  'synth_brass_1',
  'synth_brass_2',
  // Reed (64-71)
  'soprano_sax',
  'alto_sax',
  'tenor_sax',
  'baritone_sax',
  'oboe',
  'english_horn',
  'bassoon',
  'clarinet',
  // Pipe (72-79)
  'piccolo',
  'flute',
  'recorder',
  'pan_flute',
  'blown_bottle',
  'shakuhachi',
  'whistle',
  'ocarina',
  // Synth Lead (80-87)
  'lead_1_square',
  'lead_2_sawtooth',
  'lead_3_calliope',
  'lead_4_chiff',
  'lead_5_charang',
  'lead_6_voice',
  'lead_7_fifths',
  'lead_8_bass_lead',
  // Synth Pad (88-95)
  'pad_1_new_age',
  'pad_2_warm',
  'pad_3_polysynth',
  'pad_4_choir',
  'pad_5_bowed',
  'pad_6_metallic',
  'pad_7_halo',
  'pad_8_sweep',
  // Synth Effects (96-103)
  'fx_1_rain',
  'fx_2_soundtrack',
  'fx_3_crystal',
  'fx_4_atmosphere',
  'fx_5_brightness',
  'fx_6_goblins',
  'fx_7_echoes',
  'fx_8_scifi',
  // Ethnic (104-111)
  'sitar',
  'banjo',
  'shamisen',
  'koto',
  'kalimba',
  'bagpipe',
  'fiddle',
  'shanai',
  // Percussive (112-119)
  'tinkle_bell',
  'agogo',
  'steel_drums',
  'woodblock',
  'taiko_drum',
  'melodic_tom',
  'synth_drum',
  'reverse_cymbal',
  // Sound Effects (120-127)
  'guitar_fret_noise',
  'breath_noise',
  'seashore',
  'bird_tweet',
  'telephone_ring',
  'helicopter',
  'applause',
  'gunshot',
]

// Legacy track name to instrument fallback (for EventData without program field)
const LEGACY_TRACK_INSTRUMENT: Record<string, string> = {
  Aux: 'pad_2_warm',
  Bass: 'acoustic_bass',
}
const LEGACY_DEFAULT_INSTRUMENT = 'acoustic_grand_piano'

export function gmProgramToInstrumentName(program: number): string {
  if (program >= 0 && program < GM_INSTRUMENTS.length) {
    return GM_INSTRUMENTS[program]
  }
  return LEGACY_DEFAULT_INSTRUMENT
}

interface TrackInfo {
  name: string
  channel?: number
  program?: number
}

/**
 * Determine the set of smplr instrument names required for a list of tracks.
 * Returns a Map from track name to instrument name.
 * Drum tracks are excluded (handled separately by DrumMachine).
 */
export function getRequiredInstruments(tracks: TrackInfo[]): Map<string, string> {
  const result = new Map<string, string>()
  for (const track of tracks) {
    // Skip drum tracks
    if (track.channel === 9 || track.name === 'Drums') continue

    if (track.program !== undefined && track.program !== null) {
      result.set(track.name, gmProgramToInstrumentName(track.program))
    } else {
      // Legacy fallback based on track name
      result.set(track.name, LEGACY_TRACK_INSTRUMENT[track.name] ?? LEGACY_DEFAULT_INSTRUMENT)
    }
  }
  return result
}

// Global instrument cache: smplr instrument name -> loaded Soundfont instance
const instrumentCache = new Map<string, Soundfont>()
const loadingPromises = new Map<string, Promise<Soundfont>>()

export interface LoadedInstruments {
  trackMap: Map<string, Soundfont>
  drums: DrumMachine
}

/**
 * Load all instruments needed for the given tracks.
 * Uses a global cache for Soundfont instances (real-time playback).
 * When disableScheduler is true (offline rendering), creates fresh instances without caching.
 */
export async function loadInstrumentsForTracks(
  audioContext: AudioContext,
  tracks: TrackInfo[],
  options?: { disableScheduler?: boolean }
): Promise<LoadedInstruments> {
  const disableScheduler = options?.disableScheduler ?? false
  const required = getRequiredInstruments(tracks)

  // Collect unique instrument names
  const uniqueNames = new Set(required.values())

  // Load each unique instrument
  const loaded = new Map<string, Soundfont>()
  const loadPromises: Promise<void>[] = []

  for (const name of uniqueNames) {
    if (disableScheduler) {
      // Offline rendering: create fresh instance (no cache)
      loadPromises.push(
        new Soundfont(audioContext, { instrument: name as any, disableScheduler: true })
          .load.then(sf => { loaded.set(name, sf) })
      )
    } else if (instrumentCache.has(name)) {
      loaded.set(name, instrumentCache.get(name)!)
    } else if (loadingPromises.has(name)) {
      loadPromises.push(
        loadingPromises.get(name)!.then(sf => { loaded.set(name, sf) })
      )
    } else {
      const promise = new Soundfont(audioContext, { instrument: name as any })
        .load.then(sf => {
          instrumentCache.set(name, sf)
          loadingPromises.delete(name)
          loaded.set(name, sf)
          return sf
        }).catch(() => {
          // Fallback to acoustic_grand_piano on load failure
          loadingPromises.delete(name)
          if (name !== LEGACY_DEFAULT_INSTRUMENT && instrumentCache.has(LEGACY_DEFAULT_INSTRUMENT)) {
            const fallback = instrumentCache.get(LEGACY_DEFAULT_INSTRUMENT)!
            loaded.set(name, fallback)
            return fallback
          }
          return new Soundfont(audioContext, { instrument: 'acoustic_grand_piano' })
            .load.then(sf => {
              instrumentCache.set(LEGACY_DEFAULT_INSTRUMENT, sf)
              loaded.set(name, sf)
              return sf
            })
        })
      loadingPromises.set(name, promise)
      loadPromises.push(promise.then(() => {}))
    }
  }

  // Load drums
  let drums: DrumMachine
  if (disableScheduler) {
    const drumsPromise = new DrumMachine(audioContext, {
      instrument: 'Roland CR-8000',
      disableScheduler: true,
    }).load
    loadPromises.push(drumsPromise.then(() => {}))
    drums = await drumsPromise
  } else {
    // For real-time, drums are managed by the caller (useMidiPlayer keeps its own instance)
    // We still need to return one, so load or reuse
    drums = await new DrumMachine(audioContext, { instrument: 'Roland CR-8000' }).load
  }

  await Promise.all(loadPromises)

  // Build track name -> Soundfont map
  const trackMap = new Map<string, Soundfont>()
  for (const [trackName, instrumentName] of required) {
    const sf = loaded.get(instrumentName)
    if (sf) trackMap.set(trackName, sf)
  }

  return { trackMap, drums }
}
