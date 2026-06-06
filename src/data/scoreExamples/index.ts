import type { ScoreExampleDef } from './types'
import { primerExamples } from './primer'
import { scalesKeysExamples } from './scalesKeys'
import { chordsExamples } from './chords'
import { progressionsExamples } from './progressions'
import { harmonyColorExamples } from './harmonyColor'
import { melodyMotifExamples } from './melodyMotif'
import { songStructureExamples } from './songStructure'
import { configMappingExamples } from './configMapping'

export * from './types'

/** All score examples, keyed by example id used in `<ScoreExample example="...">`. */
export const scoreExampleRegistry: Record<string, ScoreExampleDef> = {
  ...primerExamples,
  ...scalesKeysExamples,
  ...chordsExamples,
  ...progressionsExamples,
  ...harmonyColorExamples,
  ...melodyMotifExamples,
  ...songStructureExamples,
  ...configMappingExamples,
}

/** Look up an example definition; returns undefined for unknown ids. */
export function getScoreExample(id: string): ScoreExampleDef | undefined {
  return scoreExampleRegistry[id]
}
