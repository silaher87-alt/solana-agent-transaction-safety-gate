import crypto from 'node:crypto';
import { base58Encode } from './base58.js';
import { readShortVec } from './shortvec.js';

function take(buffer, state, length, label) {
  if (length < 0 || state.offset + length > buffer.length) throw new Error(`Unexpected EOF reading ${label}`);
  const out = buffer.subarray(state.offset, state.offset + length);
  state.offset += length;
  return out;
}

function parseCompiledInstruction(buffer, state, accountKeys) {
  const programIdIndex = take(buffer, state, 1, 'program id index')[0];
  const accountCount = readShortVec(buffer, state);
  const accountIndexes = [...take(buffer, state, accountCount, 'instruction account indexes')];
  const dataLength = readShortVec(buffer, state);
  const data = take(buffer, state, dataLength, 'instruction data');
  const keyAt = (idx) => idx < accountKeys.length ? accountKeys[idx] : `LOOKUP_INDEX_${idx}`;
  return {
    programIdIndex,
    programId: keyAt(programIdIndex),
    accountIndexes,
    accounts: accountIndexes.map(keyAt),
    dataBase64: data.toString('base64'),
    data
  };
}

export function parseTransactionBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  if (buffer.length < 4) throw new Error('Transaction is too short');
  const state = { offset: 0 };
  const signatureCount = readShortVec(buffer, state);
  if (signatureCount > 64) throw new Error('Unreasonable signature count');
  const signatures = [];
  for (let i = 0; i < signatureCount; i++) signatures.push(take(buffer, state, 64, `signature ${i}`));
  if (state.offset >= buffer.length) throw new Error('Missing transaction message');

  let version = 'legacy';
  let first = buffer[state.offset];
  if (first & 0x80) {
    const n = first & 0x7f;
    if (n !== 0) throw new Error(`Unsupported transaction message version ${n}`);
    version = 0;
    state.offset++;
    first = buffer[state.offset];
  }

  const numRequiredSignatures = take(buffer, state, 1, 'header')[0];
  const numReadonlySignedAccounts = take(buffer, state, 1, 'header')[0];
  const numReadonlyUnsignedAccounts = take(buffer, state, 1, 'header')[0];
  const staticCount = readShortVec(buffer, state);
  if (staticCount > 256) throw new Error('Unreasonable account key count');
  const staticAccountKeys = [];
  for (let i = 0; i < staticCount; i++) staticAccountKeys.push(base58Encode(take(buffer, state, 32, `account key ${i}`)));
  const recentBlockhash = base58Encode(take(buffer, state, 32, 'recent blockhash'));
  const instructionCount = readShortVec(buffer, state);
  if (instructionCount > 256) throw new Error('Unreasonable instruction count');
  const compiledInstructions = [];
  for (let i = 0; i < instructionCount; i++) compiledInstructions.push(parseCompiledInstruction(buffer, state, staticAccountKeys));

  const addressTableLookups = [];
  let loadedWritableCount = 0;
  let loadedReadonlyCount = 0;
  if (version === 0) {
    const lookupCount = readShortVec(buffer, state);
    for (let i = 0; i < lookupCount; i++) {
      const accountKey = base58Encode(take(buffer, state, 32, 'lookup table key'));
      const writableCount = readShortVec(buffer, state);
      const writableIndexes = [...take(buffer, state, writableCount, 'lookup writable indexes')];
      const readonlyCount = readShortVec(buffer, state);
      const readonlyIndexes = [...take(buffer, state, readonlyCount, 'lookup readonly indexes')];
      loadedWritableCount += writableIndexes.length;
      loadedReadonlyCount += readonlyIndexes.length;
      addressTableLookups.push({ accountKey, writableIndexes, readonlyIndexes });
    }
  }
  if (state.offset !== buffer.length) throw new Error(`Trailing bytes after transaction: ${buffer.length - state.offset}`);

  return {
    version,
    signatureCount,
    header: { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts },
    signatureCountMatchesHeader: signatureCount === numRequiredSignatures,
    staticAccountKeys,
    recentBlockhash,
    compiledInstructions,
    addressTableLookups,
    unresolvedLookupAddressCount: loadedWritableCount + loadedReadonlyCount,
    rawLength: buffer.length,
    fingerprintSha256: crypto.createHash('sha256').update(buffer).digest('hex')
  };
}

export function parseTransactionBase64(text) {
  if (typeof text !== 'string' || text.length === 0) throw new Error('base64 transaction is required');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text) || text.length % 4 !== 0) throw new Error('Invalid base64 encoding');
  const buffer = Buffer.from(text, 'base64');
  if (buffer.length > 1232) throw new Error('Transaction exceeds Solana 1232-byte packet limit');
  return parseTransactionBuffer(buffer);
}
