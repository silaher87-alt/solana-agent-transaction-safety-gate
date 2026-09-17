import { parseTransactionBase64 } from './transaction.js';
import { decodeInstructions } from './decoders.js';
import { evaluatePolicy, normalizePolicy } from './policy.js';
import { simulateTransactionReadOnly } from './simulate.js';

export async function analyzeTransaction({ base64Transaction, policy = {}, simulate = false, rpcUrl } = {}) {
  const normalizedPolicy = normalizePolicy(policy);
  let parsed;
  try {
    parsed = parseTransactionBase64(base64Transaction);
  } catch (error) {
    return {
      schemaVersion: '1.0', decision: 'BLOCK',
      reasons: [{ level: 'BLOCK', code: 'MALFORMED_OR_UNSUPPORTED_TRANSACTION', detail: String(error?.message ?? error) }],
      policy: normalizedPolicy,
      transaction: null,
      instructions: [],
      simulation: { status: 'not_requested' }
    };
  }
  const instructions = decodeInstructions(parsed);
  let simulation = { status: 'not_requested' };
  if (simulate) simulation = await simulateTransactionReadOnly(base64Transaction, rpcUrl);
  const evaluated = evaluatePolicy(parsed, instructions, simulation, normalizedPolicy);
  const totalSolLamports = instructions.filter(x => x.type === 'SYSTEM_TRANSFER').reduce((a, x) => a + BigInt(x.lamports), 0n);
  const tokenTransfers = instructions.filter(x => x.type === 'TOKEN_TRANSFER' || x.type === 'TOKEN_TRANSFER_CHECKED');
  return {
    schemaVersion: '1.0',
    decision: evaluated.decision,
    reasons: evaluated.reasons,
    policy: evaluated.policy,
    transaction: {
      fingerprintSha256: parsed.fingerprintSha256,
      version: parsed.version,
      rawLength: parsed.rawLength,
      signatureCount: parsed.signatureCount,
      header: parsed.header,
      signatureCountMatchesHeader: parsed.signatureCountMatchesHeader,
      recentBlockhash: parsed.recentBlockhash,
      staticAccountKeys: parsed.staticAccountKeys,
      addressTableLookups: parsed.addressTableLookups,
      unresolvedLookupAddressCount: parsed.unresolvedLookupAddressCount
    },
    summary: {
      instructionCount: instructions.length,
      totalSolLamports: totalSolLamports.toString(),
      totalSol: Number(totalSolLamports) / 1_000_000_000,
      tokenTransferCount: tokenTransfers.length,
      unknownProgramCount: instructions.filter(x => !x.recognized).length,
      sensitiveInstructionCount: instructions.filter(x => x.sensitive).length
    },
    instructions: instructions.map(({ data, ...x }) => x),
    simulation
  };
}
