import type { WizardConfig } from '@/stores/useWizardStore'

/**
 * Card identifiers in the studio customization grid.
 */
export type StudioCardId =
  | 'chord'
  | 'keyTempo'
  | 'vocal'
  | 'arrangement'
  | 'effects'
  | 'fineTune'

/**
 * Config keys owned by each customization card.
 * Used for the "modified from baseline" indicator on card faces.
 * Regeneration routing itself goes through store.onConfigChange (the
 * single source of truth) — these groupings are display-only.
 */
export const CARD_KEYS: Record<StudioCardId, (keyof WizardConfig)[]> = {
  chord: ['chordProgressionId'],

  keyTempo: [
    'key', 'bpm', 'targetDurationSeconds',
    'modulationTiming', 'modulationSemitones'
  ],

  vocal: [
    'vocalLow', 'vocalHigh', 'vocalAttitude', 'vocalStyle',
    'melodyTemplate', 'vocalGroove', 'melodicComplexity', 'hookIntensity',
    'enableSyncopation', 'driveFeel', 'moraRhythmMode', 'energyCurve',
    'melodySyncopationProb'
  ],

  arrangement: [
    'blueprintId', 'compositionStyle',
    'drumsEnabled', 'guitarEnabled',
    'arpeggioEnabled', 'arpeggioPattern', 'arpeggioSpeed',
    'arpeggioOctaveRange', 'arpeggioGate', 'arpeggioSyncChord',
    'chordExtSus', 'chordExt7th', 'chordExt9th', 'chordExtTritoneSub',
    'chordExtSusProb', 'chordExt7thProb', 'chordExt9thProb', 'chordExtTritoneSubProb',
    'arrangementGrowth', 'energyCurve',
    'motifRepeatScope', 'motifFixedProgression', 'motifMaxChordCount',
    'motifLength', 'motifNoteCount', 'motifMotion', 'motifRegisterHigh', 'motifRhythmDensity'
  ],

  effects: [
    'seEnabled', 'callEnabled', 'callNotesEnabled',
    'introChant', 'mixPattern', 'callDensity',
    'humanize', 'humanizeTiming', 'humanizeVelocity'
  ],

  fineTune: [
    'melodyMaxLeap', 'melodySyncopationProb', 'melodyPhraseLength',
    'melodyLongNoteRatio', 'melodyChorusRegisterShift',
    'melodyHookRepetition', 'melodyUseLeadingTone'
  ]
}
