// ============================================================================
// Piano Roll Editor - Canvas Palettes (theme-aware)
// ============================================================================
// The canvas cannot read CSS custom properties, so the visual tokens defined
// in src/styles/demo-theme.css are mirrored here as flat, role-named values.
// The dark palette reproduces the legacy hardcoded colors verbatim so dark
// rendering stays pixel-identical; the light palette is the light-theme
// equivalent tuned for contrast on a light background.

import { NoteSafety, type NoteSafetyLevel } from './types'

/**
 * Per-safety-level color set used when filling and outlining notes.
 */
export interface SafetyColorSet {
  /** Fill color for safety hint rectangles and drag-preview ghosts. */
  bg: string
  /** Border/stroke color for note outlines and ghosts. */
  border: string
  /** Glow color (reserved for emphasis effects). */
  glow: string
  /** Solid note fill color (also used as accent text). */
  text: string
}

/**
 * Flat, role-named color palette for the layered piano-roll canvas.
 * Names map one-to-one to the canvas draw call sites in useLayeredCanvas.ts.
 */
export interface PianoRollPalette {
  /** Full-canvas background fill. */
  background: string
  /** Base shading for black-key rows. */
  blackKeyRow: string
  /** Base shading for white-key rows. */
  whiteKeyRow: string
  /** Tint overlaid on rows inside the active vocal range. */
  vocalRangeHighlight: string
  /** Dimming overlay applied to rows outside the vocal range. */
  outOfRangeOverlay: string
  /** Diagonal hatch stroke drawn over out-of-range rows. */
  outOfRangeStripe: string
  /** Horizontal per-semitone grid lines. */
  horizontalGridLine: string
  /** Emphasized line at each octave boundary. */
  octaveLine: string
  /** Faint vertical sub-beat (grid-snap) lines. */
  subBeatLine: string
  /** Vertical beat lines. */
  beatLine: string
  /** Vertical bar lines. */
  barLine: string
  /** Bar-number labels. */
  barNumber: string
  /** Outline of a selected note. */
  selectedNoteBorder: string
  /** Outline of a hovered note. */
  hoveredNoteBorder: string
  /** Triangle marker drawn on the leading edge of a selected note. */
  selectionIndicator: string
  /** Dots of the hover resize handle. */
  resizeHandleDot: string
  /** Fill of the rubber-band selection box. */
  selectionBoxFill: string
  /** Border of the rubber-band selection box. */
  selectionBoxBorder: string
  /** Safety color sets keyed by NoteSafety level. */
  safety: Record<NoteSafetyLevel, SafetyColorSet>
}

/**
 * Dark-theme palette. Values are identical to the previously hardcoded colors
 * so dark rendering is unchanged.
 */
export const DARK_PALETTE: PianoRollPalette = {
  background: 'rgba(12, 12, 18, 0.98)',
  blackKeyRow: 'rgba(0, 0, 0, 0.25)',
  whiteKeyRow: 'rgba(255, 255, 255, 0.03)',
  vocalRangeHighlight: 'rgba(139, 92, 246, 0.08)',
  outOfRangeOverlay: 'rgba(0, 0, 0, 0.5)',
  outOfRangeStripe: 'rgba(60, 60, 70, 0.4)',
  horizontalGridLine: 'rgba(255, 255, 255, 0.05)',
  octaveLine: 'rgba(139, 92, 246, 0.3)',
  subBeatLine: 'rgba(255, 255, 255, 0.05)',
  beatLine: 'rgba(139, 92, 246, 0.15)',
  barLine: 'rgba(139, 92, 246, 0.3)',
  barNumber: 'rgba(255, 255, 255, 0.4)',
  selectedNoteBorder: 'rgba(255, 255, 255, 0.9)',
  hoveredNoteBorder: 'rgba(255, 255, 255, 0.7)',
  selectionIndicator: 'rgba(255, 255, 255, 0.9)',
  resizeHandleDot: 'rgba(0, 0, 0, 0.5)',
  selectionBoxFill: 'rgba(139, 92, 246, 0.15)',
  selectionBoxBorder: 'rgba(139, 92, 246, 0.6)',
  safety: {
    [NoteSafety.Safe]: {
      bg: 'rgba(74, 222, 128, 0.25)',
      border: 'rgba(74, 222, 128, 0.6)',
      glow: 'rgba(74, 222, 128, 0.4)',
      text: '#4ADE80',
    },
    [NoteSafety.Warning]: {
      bg: 'rgba(251, 191, 36, 0.2)',
      border: 'rgba(251, 191, 36, 0.5)',
      glow: 'rgba(251, 191, 36, 0.3)',
      text: '#FBBF24',
    },
    [NoteSafety.Dissonant]: {
      bg: 'rgba(248, 113, 113, 0.15)',
      border: 'rgba(248, 113, 113, 0.4)',
      glow: 'rgba(248, 113, 113, 0.25)',
      text: '#F87171',
    },
  },
}

/**
 * Light-theme palette. Mirrors the light tokens in demo-theme.css: near-white
 * panel background, dark-ink gridlines at low alpha, purple accents on
 * 124,58,237, and stronger/darker safety hues tuned for a light background.
 */
export const LIGHT_PALETTE: PianoRollPalette = {
  background: 'rgba(252, 252, 255, 0.98)',
  blackKeyRow: 'rgba(24, 20, 35, 0.06)',
  whiteKeyRow: 'rgba(24, 20, 35, 0.01)',
  vocalRangeHighlight: 'rgba(124, 58, 237, 0.07)',
  outOfRangeOverlay: 'rgba(24, 20, 35, 0.06)',
  outOfRangeStripe: 'rgba(24, 20, 35, 0.12)',
  horizontalGridLine: 'rgba(24, 20, 35, 0.07)',
  octaveLine: 'rgba(124, 58, 237, 0.35)',
  subBeatLine: 'rgba(24, 20, 35, 0.06)',
  beatLine: 'rgba(124, 58, 237, 0.18)',
  barLine: 'rgba(124, 58, 237, 0.35)',
  barNumber: 'rgba(24, 20, 35, 0.5)',
  selectedNoteBorder: 'rgba(24, 20, 35, 0.85)',
  hoveredNoteBorder: 'rgba(24, 20, 35, 0.55)',
  selectionIndicator: 'rgba(24, 20, 35, 0.85)',
  resizeHandleDot: 'rgba(24, 20, 35, 0.45)',
  selectionBoxFill: 'rgba(124, 58, 237, 0.12)',
  selectionBoxBorder: 'rgba(124, 58, 237, 0.6)',
  safety: {
    [NoteSafety.Safe]: {
      bg: 'rgba(22, 163, 74, 0.22)',
      border: 'rgba(22, 163, 74, 0.7)',
      glow: 'rgba(22, 163, 74, 0.4)',
      text: '#16A34A',
    },
    [NoteSafety.Warning]: {
      bg: 'rgba(217, 119, 6, 0.2)',
      border: 'rgba(217, 119, 6, 0.65)',
      glow: 'rgba(217, 119, 6, 0.35)',
      text: '#D97706',
    },
    [NoteSafety.Dissonant]: {
      bg: 'rgba(220, 38, 38, 0.16)',
      border: 'rgba(220, 38, 38, 0.6)',
      glow: 'rgba(220, 38, 38, 0.3)',
      text: '#DC2626',
    },
  },
}

/**
 * Selects the canvas palette for the current appearance.
 *
 * @param isDark Whether the dark appearance is active.
 * @returns The matching {@link PianoRollPalette}.
 */
export function getPianoRollPalette(isDark: boolean): PianoRollPalette {
  return isDark ? DARK_PALETTE : LIGHT_PALETTE
}
