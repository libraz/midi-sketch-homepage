/**
 * midi-sketch TypeScript Type Definitions
 */

/**
 * Key enumeration (C=0 through B=11)
 */
export type Key = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Structure pattern ID (0-4)
 */
export type StructureId = 0 | 1 | 2 | 3 | 4;

/**
 * Mood preset ID (0-15)
 */
export type MoodId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/**
 * Chord progression ID (0-15)
 */
export type ChordId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/**
 * Generation parameters
 */
export interface GeneratorParams {
  /** Structure pattern (0-4) */
  structureId?: StructureId;
  /** Mood preset (0-15) */
  moodId?: MoodId;
  /** Chord progression (0-15) */
  chordId?: ChordId;
  /** Key (0-11: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B) */
  key?: Key;
  /** Enable drums track */
  drumsEnabled?: boolean;
  /** Enable key modulation */
  modulation?: boolean;
  /** Vocal range lower bound (MIDI note, e.g., 60=C4) */
  vocalLow?: number;
  /** Vocal range upper bound (MIDI note, e.g., 79=G5) */
  vocalHigh?: number;
  /** Tempo (60-180, 0=use mood default) */
  bpm?: number;
  /** Random seed (0=auto) */
  seed?: number;
}

/**
 * Generation info returned after generation
 */
export interface GenerationInfo {
  /** Total number of bars */
  totalBars: number;
  /** Total duration in ticks */
  totalTicks: number;
  /** Actual BPM used */
  bpm: number;
  /** Number of tracks */
  trackCount: number;
}

/**
 * Preset information
 */
export interface PresetInfo {
  /** Preset name */
  name: string;
  /** Display string (for chord progressions) */
  display?: string;
  /** Default BPM (for moods) */
  defaultBpm?: number;
}

/**
 * Note event in the event data
 */
export interface NoteEvent {
  /** MIDI pitch (0-127) */
  pitch: number;
  /** MIDI velocity (0-127) */
  velocity: number;
  /** Start time in ticks */
  start: number;
  /** Duration in ticks */
  duration: number;
}

/**
 * Track data in the event data
 */
export interface TrackData {
  /** Track name */
  name: string;
  /** MIDI channel (0-15) */
  channel: number;
  /** MIDI program number */
  program: number;
  /** Note events */
  notes: NoteEvent[];
}

/**
 * Section data
 */
export interface Section {
  /** Section type */
  type: 'Intro' | 'A' | 'B' | 'Chorus';
  /** Number of bars */
  bars: number;
  /** Start time in ticks */
  startTick: number;
}

/**
 * Event data returned by getEvents()
 */
export interface EventData {
  /** Song sections */
  sections: Section[];
  /** All tracks */
  tracks: TrackData[];
  /** Tempo in BPM */
  bpm: number;
  /** Total duration in ticks */
  totalTicks: number;
}

/**
 * MidiSketch instance for MIDI generation
 */
export declare class MidiSketch {
  constructor();

  /**
   * Generate MIDI with the given parameters
   */
  generate(params?: GeneratorParams): void;

  /**
   * Regenerate only the melody track
   * @param seed New random seed (0=auto)
   */
  regenerateMelody(seed?: number): void;

  /**
   * Get the generated MIDI data
   */
  getMidi(): Uint8Array;

  /**
   * Get the event data as JSON
   */
  getEvents(): EventData;

  /**
   * Get generation info
   */
  getInfo(): GenerationInfo;

  /**
   * Destroy the instance and free resources
   */
  destroy(): void;
}

/**
 * Initialize the WASM module
 * Must be called before using other functions
 */
export declare function init(): Promise<void>;

/**
 * Get library version
 */
export declare function getVersion(): string;

/**
 * Get available structure presets
 */
export declare function getStructures(): PresetInfo[];

/**
 * Get available mood presets
 */
export declare function getMoods(): PresetInfo[];

/**
 * Get available chord progression presets
 */
export declare function getChords(): PresetInfo[];

/**
 * Download MIDI data as a file
 * @param midiData MIDI binary data
 * @param filename Output filename
 */
export declare function downloadMidi(midiData: Uint8Array, filename?: string): void;

declare const midisketch: {
  init: typeof init;
  getVersion: typeof getVersion;
  getStructures: typeof getStructures;
  getMoods: typeof getMoods;
  getChords: typeof getChords;
  MidiSketch: typeof MidiSketch;
  downloadMidi: typeof downloadMidi;
};

export default midisketch;
