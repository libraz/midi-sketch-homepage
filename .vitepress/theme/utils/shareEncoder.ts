/**
 * Share URL Encoder/Decoder
 *
 * Encodes WizardConfig to a compact URL hash using bit-packing and Base36.
 * Format: V1{base36-encoded-data}
 *
 * All parameters are packed into a bit stream, then converted to Base36 (0-9, A-Z).
 */

import type { WizardConfig } from '../stores/useWizardStore'

// Version prefix for future compatibility
const VERSION = 1

// Share types
export type ShareType = 'bgm' | 'vocal'

// Field definitions: [key, bits, offset?, max?]
// offset: value to subtract before encoding (for ranges like bpm 60-180)
// max: maximum value (for validation)
type FieldDef = [keyof WizardConfig | 'shareType', number, number?, number?]

// Encoding schema - order matters!
// Total bits: 4 + 1 + 32 + 6 + 6 + 4 + 8 + 4 + 2 + ... ≈ 180 bits ≈ 35 Base36 chars
const FIELD_SCHEMA: FieldDef[] = [
  // Header
  // version is handled separately
  ['shareType', 1],           // 0=bgm, 1=vocal

  // Core (deterministic seed)
  ['seed', 32],               // 0-0xFFFFFFFF

  // Style & Structure
  ['stylePresetId', 6],       // 0-63
  ['chordProgressionId', 6],  // 0-63
  ['key', 4],                 // 0-11
  ['bpm', 8, 60],             // 60-180 → 0-120
  ['formId', 4],              // 0-15
  ['compositionStyle', 2],    // 0-2
  ['targetDurationSeconds', 9, 0, 300], // 0-300 seconds

  // Drums & Arpeggio
  ['drumsEnabled', 1],
  ['arpeggioEnabled', 1],
  ['arpeggioPattern', 2],     // 0-3
  ['arpeggioSpeed', 2],       // 0-2
  ['arpeggioOctaveRange', 2], // 1-3 → 0-2
  ['arpeggioGate', 7],        // 0-100
  ['arpeggioSyncChord', 1],

  // Chord Extensions
  ['chordExtSus', 1],
  ['chordExt7th', 1],
  ['chordExt9th', 1],
  ['chordExtSusProb', 7],     // 0-100
  ['chordExt7thProb', 7],     // 0-100
  ['chordExt9thProb', 7],     // 0-100

  // Modulation
  ['modulationTiming', 3],    // 0-4
  ['modulationSemitones', 3], // 1-4 → 0-3

  // Call/SE
  ['callEnabled', 1],
  ['callNotesEnabled', 1],
  ['introChant', 2],          // 0-2
  ['mixPattern', 2],          // 0-2
  ['callDensity', 2],         // 0-3

  // Arrangement
  ['arrangementGrowth', 1],   // 0-1
  ['motifRepeatScope', 1],    // 0-1
  ['motifFixedProgression', 1],
  ['motifMaxChordCount', 4],  // 0-8

  // Humanize
  ['humanize', 1],
  ['humanizeTiming', 7],      // 0-100
  ['humanizeVelocity', 7],    // 0-100

  // Melodic
  ['melodicComplexity', 2],   // 0-2
  ['hookIntensity', 2],       // 0-3

  // Vocal
  ['vocalLow', 7, 36],        // 36-96 → 0-60 (MIDI note)
  ['vocalHigh', 7, 36],       // 36-96 → 0-60 (MIDI note)
  ['vocalAttitude', 2],       // 0-2
  ['vocalStyle', 4],          // 0-12
  ['vocalNoteDensity', 8],    // 0-200
  ['vocalMinNoteDivision', 5], // 0, 4, 8, 16 → encoded as raw
  ['vocalRestRatio', 6],      // 0-50
  ['vocalRestRatioMode', 1],  // 0-1
  ['vocalAllowExtremLeap', 2], // 0-2
  ['vocalGroove', 3],         // 0-5
]

// Calculate total bits (version + fields + CRC16)
const DATA_BITS = 4 + FIELD_SCHEMA.reduce((sum, [, bits]) => sum + bits, 0) // +4 for version
const DATA_BYTES = Math.ceil(DATA_BITS / 8)
const CRC_BITS = 16
const TOTAL_BYTES = DATA_BYTES + Math.ceil(CRC_BITS / 8) // 26 + 2 = 28

/**
 * CRC16-CCITT calculation
 */
function crc16(data: Uint8Array): number {
  let crc = 0xFFFF
  for (const byte of data) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xFFFF
    }
  }
  return crc
}

/**
 * BitWriter - writes values to a bit stream
 */
class BitWriter {
  private buffer: number[] = []
  private currentByte = 0
  private bitPos = 0

  write(value: number, bits: number): void {
    for (let i = bits - 1; i >= 0; i--) {
      const bit = (value >> i) & 1
      this.currentByte = (this.currentByte << 1) | bit
      this.bitPos++

      if (this.bitPos === 8) {
        this.buffer.push(this.currentByte)
        this.currentByte = 0
        this.bitPos = 0
      }
    }
  }

  finish(): Uint8Array {
    // Pad remaining bits with zeros
    if (this.bitPos > 0) {
      this.currentByte <<= (8 - this.bitPos)
      this.buffer.push(this.currentByte)
    }
    return new Uint8Array(this.buffer)
  }
}

/**
 * BitReader - reads values from a bit stream
 */
class BitReader {
  private data: Uint8Array
  private bytePos = 0
  private bitPos = 0

  constructor(data: Uint8Array) {
    this.data = data
  }

  read(bits: number): number {
    let value = 0
    for (let i = 0; i < bits; i++) {
      if (this.bytePos >= this.data.length) {
        return value // Return partial value if we run out of data
      }

      const bit = (this.data[this.bytePos] >> (7 - this.bitPos)) & 1
      value = (value << 1) | bit
      this.bitPos++

      if (this.bitPos === 8) {
        this.bytePos++
        this.bitPos = 0
      }
    }
    return value
  }
}

/**
 * Convert Uint8Array to Base36 string (uppercase)
 */
function toBase36(data: Uint8Array): string {
  // Convert bytes to a big integer
  let num = 0n
  for (const byte of data) {
    num = (num << 8n) | BigInt(byte)
  }

  if (num === 0n) return '0'

  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  while (num > 0n) {
    result = chars[Number(num % 36n)] + result
    num = num / 36n
  }

  return result
}

/**
 * Convert Base36 string to Uint8Array
 */
function fromBase36(str: string): Uint8Array {
  const upper = str.toUpperCase()
  let num = 0n

  for (const char of upper) {
    const digit = char >= '0' && char <= '9'
      ? char.charCodeAt(0) - 48
      : char.charCodeAt(0) - 55 // A=10, B=11, etc.

    if (digit < 0 || digit >= 36) {
      throw new Error(`Invalid Base36 character: ${char}`)
    }

    num = num * 36n + BigInt(digit)
  }

  // Convert back to bytes
  const bytes: number[] = []
  while (num > 0n) {
    bytes.unshift(Number(num & 0xFFn))
    num = num >> 8n
  }

  // Ensure we have enough bytes for our data
  while (bytes.length < TOTAL_BYTES) {
    bytes.unshift(0)
  }

  return new Uint8Array(bytes)
}

/**
 * Encode config to share URL hash
 */
export function encodeShareUrl(config: WizardConfig, shareType: ShareType): string {
  const writer = new BitWriter()

  // Write version (4 bits)
  writer.write(VERSION, 4)

  // Write all fields
  for (const [key, bits, offset = 0] of FIELD_SCHEMA) {
    let value: number

    if (key === 'shareType') {
      value = shareType === 'vocal' ? 1 : 0
    } else {
      const rawValue = config[key]
      value = typeof rawValue === 'boolean' ? (rawValue ? 1 : 0) : (rawValue as number)
      value = Math.max(0, value - offset)
    }

    // Clamp to max bits
    const maxValue = (1 << bits) - 1
    value = Math.min(value, maxValue)

    writer.write(value, bits)
  }

  // Get data bytes for CRC calculation
  const dataBytes = writer.finish()

  // Calculate CRC16
  const crcValue = crc16(dataBytes)

  // Write CRC16 to a new writer (append to data)
  const finalWriter = new BitWriter()
  for (const byte of dataBytes) {
    finalWriter.write(byte, 8)
  }
  finalWriter.write(crcValue, 16)

  const finalBytes = finalWriter.finish()
  const base36 = toBase36(finalBytes)

  return base36
}

/**
 * Decoded share data
 */
export interface DecodedShare {
  version: number
  shareType: ShareType
  config: Partial<WizardConfig>
}

/**
 * Decode share URL hash to config
 */
export function decodeShareUrl(hash: string): DecodedShare | null {
  try {
    // Remove leading # if present
    if (hash.startsWith('#')) {
      hash = hash.slice(1)
    }

    // Decode Base36 directly (version is embedded in data)
    const allBytes = fromBase36(hash)

    // Extract data and CRC portions
    const dataBytes = allBytes.slice(0, DATA_BYTES)
    const crcReader = new BitReader(allBytes.slice(DATA_BYTES))
    const storedCrc = crcReader.read(16)

    // Verify CRC
    const calculatedCrc = crc16(dataBytes)
    if (storedCrc !== calculatedCrc) {
      console.error(`CRC mismatch: stored=${storedCrc}, calculated=${calculatedCrc}`)
      return null
    }

    const reader = new BitReader(dataBytes)

    // Read version from data (4 bits)
    const dataVersion = reader.read(4)

    // Check supported version
    if (dataVersion !== VERSION) {
      console.warn(`Unsupported version: ${dataVersion}, current: ${VERSION}`)
    }

    // Read all fields
    const config: Partial<WizardConfig> = {}
    let shareType: ShareType = 'bgm'

    for (const [key, bits, offset = 0] of FIELD_SCHEMA) {
      const value = reader.read(bits)

      if (key === 'shareType') {
        shareType = value === 1 ? 'vocal' : 'bgm'
      } else {
        // Determine if this is a boolean field
        const isBooleanField = [
          'drumsEnabled', 'arpeggioEnabled', 'arpeggioSyncChord',
          'chordExtSus', 'chordExt7th', 'chordExt9th',
          'callEnabled', 'callNotesEnabled',
          'motifFixedProgression', 'humanize'
        ].includes(key)

        if (isBooleanField) {
          (config as any)[key] = value === 1
        } else {
          (config as any)[key] = value + offset
        }
      }
    }

    return {
      version: dataVersion,
      shareType,
      config
    }
  } catch (e) {
    console.error('Failed to decode share URL:', e)
    return null
  }
}

/**
 * Generate full share URL
 */
export function generateShareUrl(config: WizardConfig, shareType: ShareType, baseUrl?: string): string {
  const hash = encodeShareUrl(config, shareType)

  if (typeof window !== 'undefined' && !baseUrl) {
    const origin = window.location.origin
    const lang = window.location.pathname.startsWith('/ja') ? '/ja' : ''
    return `${origin}${lang}/preview#${hash}`
  }

  return `${baseUrl || ''}/preview#${hash}`
}

/**
 * Generate X share URL
 */
export function generateXShareUrl(config: WizardConfig, shareType: ShareType, text: string): string {
  const shareUrl = generateShareUrl(config, shareType)

  const tweetText = encodeURIComponent(text)
  const url = encodeURIComponent(shareUrl)
  const hashtags = encodeURIComponent('MIDISketch,DTM')

  return `https://x.com/intent/tweet?text=${tweetText}&url=${url}&hashtags=${hashtags}`
}
