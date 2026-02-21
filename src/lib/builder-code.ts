/**
 * ERC-8021 Builder Code Attribution
 *
 * Appends a standardised attribution suffix to transaction calldata so that
 * Base's offchain indexers can attribute the transaction to this app.
 *
 * Suffix format (all hex, appended after existing calldata with no 0x prefix):
 *   [code_byte_length (1 byte)] [code_utf8_bytes] [schema_id (1 byte = 0x00)] [ERC_MARKER (16 bytes)]
 *
 * ERC_MARKER = 0x8021 repeated 8 times = 80218021802180218021802180218021
 *
 * Reference: https://docs.base.org/base-chain/builder-codes/builder-codes
 */

const SCHEMA_ID = '00';
const ERC_MARKER = '80218021802180218021802180218021'; // 8021 × 8 = 16 bytes

/**
 * Build the raw hex suffix (no 0x prefix) for a given builder code string.
 * e.g. "bc_dmzc33g1" → "0b62635f646d7a63333367310080218021802180218021802180218021"
 */
export function buildAttributionSuffix(builderCode: string): string {
  const codeHex = Buffer.from(builderCode, 'utf8').toString('hex');
  const codeLengthHex = builderCode.length.toString(16).padStart(2, '0');
  return codeLengthHex + codeHex + SCHEMA_ID + ERC_MARKER;
}

/**
 * Append the ERC-8021 attribution suffix to existing transaction calldata.
 *
 * @param txData  Hex calldata string — with or without leading 0x.
 * @param builderCode  Your registered builder code (falls back to BUILDER_CODE env var).
 * @returns Modified calldata string with 0x prefix.
 */
export function appendBuilderCode(txData: string, builderCode?: string): string {
  const code = builderCode ?? process.env.BUILDER_CODE;
  if (!code) {
    console.warn('[ERC-8021] BUILDER_CODE not set — sending transaction without attribution');
    return txData.startsWith('0x') ? txData : '0x' + txData;
  }

  const base = txData.startsWith('0x') ? txData.slice(2) : txData;
  return '0x' + base + buildAttributionSuffix(code);
}
