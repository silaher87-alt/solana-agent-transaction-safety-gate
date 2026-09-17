const RANK = { ALLOW: 0, REVIEW: 1, BLOCK: 2 };
const VALID = new Set(Object.keys(RANK));

export const DEFAULT_POLICY = Object.freeze({
  policyVersion: '1.0',
  maxSolSpendLamports: '100000000',
  maxTokenAmountRaw: '1000000',
  requireRecipientAllowlist: false,
  recipientAllowlist: [],
  recipientNotAllowed: 'BLOCK',
  unknownProgram: 'REVIEW',
  unresolvedLookup: 'REVIEW',
  authorityChange: 'BLOCK',
  sensitiveTokenInstruction: 'REVIEW',
  simulationFailure: 'BLOCK',
  simulationRequired: false,
  simulationMissing: 'REVIEW',
  signatureCountMismatch: 'BLOCK'
});

function normalizeDecision(value, fallback) {
  return VALID.has(value) ? value : fallback;
}
function maxDecision(a, b) { return RANK[a] >= RANK[b] ? a : b; }
function safeBigInt(v, fallback) { try { return BigInt(v); } catch { return fallback; } }

export function normalizePolicy(input = {}) {
  const p = { ...DEFAULT_POLICY, ...input };
  p.recipientAllowlist = Array.isArray(p.recipientAllowlist) ? [...new Set(p.recipientAllowlist.map(String))].sort() : [];
  for (const field of ['recipientNotAllowed','unknownProgram','unresolvedLookup','authorityChange','sensitiveTokenInstruction','simulationFailure','simulationMissing','signatureCountMismatch']) {
    p[field] = normalizeDecision(p[field], DEFAULT_POLICY[field]);
  }
  p.maxSolSpendLamports = safeBigInt(p.maxSolSpendLamports, BigInt(DEFAULT_POLICY.maxSolSpendLamports)).toString();
  p.maxTokenAmountRaw = safeBigInt(p.maxTokenAmountRaw, BigInt(DEFAULT_POLICY.maxTokenAmountRaw)).toString();
  p.policyVersion = String(p.policyVersion ?? DEFAULT_POLICY.policyVersion);
  p.simulationRequired = Boolean(p.simulationRequired);
  p.requireRecipientAllowlist = Boolean(p.requireRecipientAllowlist);
  return p;
}

export function evaluatePolicy(parsed, decoded, simulation, inputPolicy = {}) {
  const policy = normalizePolicy(inputPolicy);
  let decision = 'ALLOW';
  const reasons = [];
  const add = (level, code, detail = {}) => {
    decision = maxDecision(decision, level);
    reasons.push({ level, code, ...detail });
  };

  if (!parsed.signatureCountMatchesHeader) add(policy.signatureCountMismatch, 'SIGNATURE_COUNT_HEADER_MISMATCH');
  if (parsed.unresolvedLookupAddressCount > 0) add(policy.unresolvedLookup, 'UNRESOLVED_ADDRESS_LOOKUP_ENTRIES', { count: parsed.unresolvedLookupAddressCount });

  const solCap = BigInt(policy.maxSolSpendLamports);
  const tokenCap = BigInt(policy.maxTokenAmountRaw);
  for (const ix of decoded) {
    if (!ix.recognized) add(policy.unknownProgram, 'UNKNOWN_PROGRAM', { instruction: ix.index, programId: ix.programId });
    if (ix.type === 'UNRESOLVED_LOOKUP_PROGRAM') add(policy.unresolvedLookup, 'UNRESOLVED_PROGRAM_ID', { instruction: ix.index });
    if (ix.type === 'SYSTEM_TRANSFER') {
      const amount = BigInt(ix.lamports);
      if (amount > solCap) add('BLOCK', 'SOL_SPEND_CAP_EXCEEDED', { instruction: ix.index, lamports: ix.lamports, cap: policy.maxSolSpendLamports });
      if (policy.requireRecipientAllowlist && !policy.recipientAllowlist.includes(ix.destination)) add(policy.recipientNotAllowed, 'RECIPIENT_NOT_ALLOWLISTED', { instruction: ix.index, destination: ix.destination });
    }
    if (ix.type === 'TOKEN_TRANSFER' || ix.type === 'TOKEN_TRANSFER_CHECKED') {
      const amount = BigInt(ix.amountRaw);
      if (amount > tokenCap) add('BLOCK', 'TOKEN_SPEND_CAP_EXCEEDED', { instruction: ix.index, amountRaw: ix.amountRaw, cap: policy.maxTokenAmountRaw, mint: ix.mint ?? null });
      if (policy.requireRecipientAllowlist && !policy.recipientAllowlist.includes(ix.destination)) add(policy.recipientNotAllowed, 'RECIPIENT_NOT_ALLOWLISTED', { instruction: ix.index, destination: ix.destination });
    }
    if (ix.type === 'TOKEN_SET_AUTHORITY') add(policy.authorityChange, 'AUTHORITY_CHANGE_INSTRUCTION', { instruction: ix.index, target: ix.target });
    if (ix.sensitive && ix.type !== 'TOKEN_SET_AUTHORITY') add(policy.sensitiveTokenInstruction, 'SENSITIVE_TOKEN_INSTRUCTION', { instruction: ix.index, type: ix.type });
  }

  if (simulation?.status === 'error') add(policy.simulationFailure, 'SIMULATION_FAILED', { error: simulation.error ?? simulation.err ?? 'unknown' });
  if (policy.simulationRequired && (!simulation || simulation.status === 'not_requested' || simulation.status === 'unavailable')) add(policy.simulationMissing, 'SIMULATION_REQUIRED_BUT_UNAVAILABLE');

  return { decision, reasons, policy };
}
