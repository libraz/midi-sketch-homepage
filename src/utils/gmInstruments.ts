import { Soundfont, DrumMachine } from 'smplr'

export const DEMO_SOUNDFONT_KIT = 'FluidR3_GM'

/** Drum machines available in the smplr drum-machine dataset */
export type DrumKitName = 'TR-808' | 'LM-2' | 'Casio-RZ1' | 'MFB-512' | 'Roland CR-8000'

export const DEMO_DRUM_MACHINE: DrumKitName = 'TR-808'

// GM drum note number to drum-machine sample name, per kit.
// Sample names must match each kit's dm.json exactly
// (see https://smpldsnds.github.io/drum-machines/<kit>/dm.json) —
// unknown names fail silently, so keep these lists in sync with the datasets.
// GM notes: 35/36 kick, 37 side stick, 38/40 snare, 39 clap, 41-50 toms/hats,
// 49-59 cymbals, 54 tambourine, 56 cowbell, 60-64 congas, 69/70/82 shakers, 75 claves.
const GM_TO_DRUM_BY_KIT: Record<DrumKitName, Record<number, string>> = {
  'TR-808': {
    35: 'kick', 36: 'kick', 37: 'rimshot', 38: 'snare', 39: 'clap', 40: 'snare',
    41: 'tom-low', 42: 'hihat-close', 43: 'tom-low', 44: 'hihat-close',
    45: 'tom-low', 46: 'hihat-open', 47: 'mid-tom', 48: 'mid-tom',
    49: 'cymbal', 50: 'tom-hi', 51: 'cymbal', 52: 'cymbal', 53: 'cymbal',
    54: 'maraca', 55: 'cymbal', 56: 'cowbell', 57: 'cymbal', 59: 'cymbal',
    60: 'conga-hi', 61: 'conga-low', 62: 'conga-mid', 63: 'conga-hi', 64: 'conga-low',
    69: 'maraca', 70: 'maraca', 75: 'clave', 82: 'maraca',
  },
  // LinnDrum — sampled real drums; the closest to an acoustic pop/band kit
  'LM-2': {
    35: 'kick', 36: 'kick', 37: 'stick-m', 38: 'snare-m', 39: 'clap', 40: 'snare-h',
    41: 'tom-ll', 42: 'hhclosed', 43: 'tom-l', 44: 'hhclosed',
    45: 'tom-m', 46: 'hhopen', 47: 'tom-m', 48: 'tom-h',
    49: 'crash', 50: 'tom-hh', 51: 'ride', 52: 'crash', 53: 'ride',
    54: 'tambourine', 55: 'crash', 56: 'cowbell', 57: 'crash', 59: 'ride',
    60: 'conga-h', 61: 'conga-l', 62: 'conga-m', 63: 'conga-h', 64: 'conga-ll',
    69: 'cabasa', 70: 'cabasa', 75: 'stick-h', 82: 'cabasa',
  },
  // 80s digital crunch; no congas/shakers, so those fall back to toms/hats
  'Casio-RZ1': {
    35: 'kick', 36: 'kick', 37: 'clave', 38: 'snare', 39: 'clap', 40: 'snare',
    41: 'tom-3', 42: 'hihat-closed', 43: 'tom-3', 44: 'hihat-closed',
    45: 'tom-2', 46: 'hihat-open', 47: 'tom-2', 48: 'tom-1',
    49: 'crash', 50: 'tom-1', 51: 'ride', 52: 'ride', 53: 'ride',
    54: 'hihat-closed', 55: 'crash', 56: 'cowbell', 57: 'crash', 59: 'ride',
    60: 'tom-1', 61: 'tom-2', 62: 'tom-1', 63: 'tom-1', 64: 'tom-2',
    69: 'hihat-closed', 70: 'hihat-closed', 75: 'clave', 82: 'hihat-closed',
  },
  // Minimal analog kit; percussion approximated with hats/toms
  'MFB-512': {
    35: 'kick', 36: 'kick', 37: 'snare', 38: 'snare', 39: 'clap', 40: 'snare',
    41: 'tom-low', 42: 'hihat-closed', 43: 'tom-low', 44: 'hihat-closed',
    45: 'tom-mid', 46: 'hihat-open', 47: 'tom-mid', 48: 'tom-hi',
    49: 'cymbal', 50: 'tom-hi', 51: 'cymbal', 52: 'cymbal', 53: 'cymbal',
    54: 'hihat-closed', 55: 'cymbal', 56: 'hihat-closed', 57: 'cymbal', 59: 'cymbal',
    60: 'tom-hi', 61: 'tom-mid', 62: 'tom-hi', 63: 'tom-hi', 64: 'tom-mid',
    69: 'hihat-closed', 70: 'hihat-closed', 75: 'hihat-closed', 82: 'hihat-closed',
  },
  // Disco-era analog ('cymball' is the dataset's own spelling)
  'Roland CR-8000': {
    35: 'kick', 36: 'kick', 37: 'rimshot', 38: 'snare', 39: 'clap', 40: 'snare',
    41: 'tom-low', 42: 'hihat-closed', 43: 'tom-low', 44: 'hihat-closed',
    45: 'tom-low', 46: 'hihat-open', 47: 'tom-high', 48: 'tom-high',
    49: 'cymball', 50: 'tom-high', 51: 'cymball', 52: 'cymball', 53: 'cymball',
    54: 'hihat-closed', 55: 'cymball', 56: 'cowbell', 57: 'cymball', 59: 'cymball',
    60: 'conga-high', 61: 'conga-low', 62: 'conga-high', 63: 'conga-high', 64: 'conga-low',
    69: 'hihat-closed', 70: 'hihat-closed', 75: 'clave', 82: 'hihat-closed',
  },
}

/** Resolve a GM drum note to the given kit's sample name (undefined = unmapped, stays silent) */
export function gmToDrumSample(gmNote: number, kit: DrumKitName = DEMO_DRUM_MACHINE): string | undefined {
  return GM_TO_DRUM_BY_KIT[kit]?.[gmNote] ?? GM_TO_DRUM_BY_KIT[DEMO_DRUM_MACHINE][gmNote]
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
  Bass: 'electric_bass_finger',
}
const LEGACY_DEFAULT_INSTRUMENT = 'acoustic_grand_piano'

export interface TrackPlaybackProfile {
  instrument: string
  velocityScale: number
  maxVelocity: number
  minVelocity: number
}

const TRACK_PLAYBACK_PROFILES: Record<string, TrackPlaybackProfile> = {
  Vocal: {
    instrument: 'acoustic_grand_piano',
    velocityScale: 0.92,
    maxVelocity: 108,
    minVelocity: 36,
  },
  Bass: {
    instrument: 'electric_bass_finger',
    velocityScale: 0.78,
    maxVelocity: 96,
    minVelocity: 34,
  },
  Chord: {
    instrument: 'electric_piano_1',
    velocityScale: 0.58,
    maxVelocity: 82,
    minVelocity: 24,
  },
  Aux: {
    instrument: 'pad_2_warm',
    velocityScale: 0.42,
    maxVelocity: 70,
    minVelocity: 18,
  },
  Motif: {
    instrument: 'electric_piano_1',
    velocityScale: 0.46,
    maxVelocity: 74,
    minVelocity: 18,
  },
  Arpeggio: {
    instrument: 'electric_piano_2',
    velocityScale: 0.50,
    maxVelocity: 76,
    minVelocity: 20,
  },
  Guitar: {
    instrument: 'electric_guitar_clean',
    velocityScale: 0.56,
    maxVelocity: 82,
    minVelocity: 22,
  },
  Drums: {
    instrument: 'acoustic_grand_piano',
    velocityScale: 0.78,
    maxVelocity: 104,
    minVelocity: 24,
  },
  SE: {
    instrument: 'pad_2_warm',
    velocityScale: 0.30,
    maxVelocity: 54,
    minVelocity: 12,
  },
}

function clampVelocity(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function gmProgramToInstrumentName(program: number): string {
  if (program >= 0 && program < GM_INSTRUMENTS.length) {
    return GM_INSTRUMENTS[program]
  }
  return LEGACY_DEFAULT_INSTRUMENT
}

export function getTrackPlaybackProfile(track: TrackInfo): TrackPlaybackProfile {
  const roleProfile = TRACK_PLAYBACK_PROFILES[track.name]
  if (roleProfile) return roleProfile

  const instrument = track.program !== undefined && track.program !== null
    ? gmProgramToInstrumentName(track.program)
    : (LEGACY_TRACK_INSTRUMENT[track.name] ?? LEGACY_DEFAULT_INSTRUMENT)

  return {
    instrument,
    velocityScale: 0.70,
    maxVelocity: 96,
    minVelocity: 22,
  }
}

export function scaleTrackVelocity(track: TrackInfo, velocity: number): number {
  const profile = getTrackPlaybackProfile(track)
  return clampVelocity(velocity * profile.velocityScale, profile.minVelocity, profile.maxVelocity)
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

    result.set(track.name, getTrackPlaybackProfile(track).instrument)
  }
  return result
}

// Global instrument cache: smplr instrument name -> loaded Soundfont instance
const instrumentCache = new Map<string, Soundfont>()
const loadingPromises = new Map<string, Promise<Soundfont>>()

// Drum machine cache for real-time playback: kit name -> loaded instance.
// Keyed per kit so switching song images swaps kits without re-fetching samples.
const drumMachineCache = new Map<DrumKitName, Promise<DrumMachine>>()

/**
 * Load a drum machine for the given kit.
 * Real-time instances are cached per kit; offline (disableScheduler) instances are always fresh.
 */
export function loadDrumMachine(
  audioContext: AudioContext,
  kit: DrumKitName = DEMO_DRUM_MACHINE,
  disableScheduler = false
): Promise<DrumMachine> {
  if (disableScheduler) {
    return new DrumMachine(audioContext, { instrument: kit, disableScheduler: true }).load
  }
  let cached = drumMachineCache.get(kit)
  if (!cached) {
    cached = new DrumMachine(audioContext, { instrument: kit }).load
    drumMachineCache.set(kit, cached)
  }
  return cached
}

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
  options?: { disableScheduler?: boolean; drumKit?: DrumKitName }
): Promise<LoadedInstruments> {
  const disableScheduler = options?.disableScheduler ?? false
  const drumKit = options?.drumKit ?? DEMO_DRUM_MACHINE
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
        new Soundfont(audioContext, {
          instrument: name as any,
          kit: DEMO_SOUNDFONT_KIT,
          disableScheduler: true,
        })
          .load.then(sf => { loaded.set(name, sf) })
      )
    } else if (instrumentCache.has(name)) {
      loaded.set(name, instrumentCache.get(name)!)
    } else if (loadingPromises.has(name)) {
      loadPromises.push(
        loadingPromises.get(name)!.then(sf => { loaded.set(name, sf) })
      )
    } else {
      const promise = new Soundfont(audioContext, {
        instrument: name as any,
        kit: DEMO_SOUNDFONT_KIT,
      })
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
          return new Soundfont(audioContext, {
            instrument: 'acoustic_grand_piano',
            kit: DEMO_SOUNDFONT_KIT,
          })
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

  // Load drums for the requested kit (cached per kit for real-time playback)
  const drumsPromise = loadDrumMachine(audioContext, drumKit, disableScheduler)
  loadPromises.push(drumsPromise.then(() => {}))
  const drums = await drumsPromise

  await Promise.all(loadPromises)

  // Build track name -> Soundfont map
  const trackMap = new Map<string, Soundfont>()
  for (const [trackName, instrumentName] of required) {
    const sf = loaded.get(instrumentName)
    if (sf) trackMap.set(trackName, sf)
  }

  return { trackMap, drums }
}
