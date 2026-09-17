export const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';

function u32le(buf, offset = 0) {
  if (offset + 4 > buf.length) return null;
  return buf.readUInt32LE(offset);
}
function u64le(buf, offset = 0) {
  if (offset + 8 > buf.length) return null;
  return buf.readBigUInt64LE(offset);
}

export function decodeInstruction(compiled, index) {
  const data = compiled.data;
  const base = {
    index,
    programId: compiled.programId,
    accounts: compiled.accounts,
    accountIndexes: compiled.accountIndexes,
    recognized: false,
    type: 'UNKNOWN',
    sensitive: false
  };
  if (compiled.programId.startsWith('LOOKUP_INDEX_')) {
    return { ...base, type: 'UNRESOLVED_LOOKUP_PROGRAM', reason: 'PROGRAM_ID_REQUIRES_ADDRESS_LOOKUP_RESOLUTION' };
  }
  if (compiled.programId === SYSTEM_PROGRAM_ID) {
    const tag = u32le(data, 0);
    if (tag === 2 && data.length >= 12) {
      const lamports = u64le(data, 4);
      return {
        ...base, recognized: true, type: 'SYSTEM_TRANSFER',
        source: compiled.accounts[0] ?? null,
        destination: compiled.accounts[1] ?? null,
        lamports: lamports.toString(),
        sol: Number(lamports) / 1_000_000_000
      };
    }
    return { ...base, recognized: true, type: `SYSTEM_INSTRUCTION_${tag ?? 'MALFORMED'}` };
  }
  if (compiled.programId === TOKEN_PROGRAM_ID || compiled.programId === TOKEN_2022_PROGRAM_ID) {
    const tag = data.length ? data[0] : null;
    if (tag === 3 && data.length >= 9) {
      const amount = u64le(data, 1);
      return {
        ...base, recognized: true, type: 'TOKEN_TRANSFER',
        source: compiled.accounts[0] ?? null,
        destination: compiled.accounts[1] ?? null,
        authority: compiled.accounts[2] ?? null,
        amountRaw: amount.toString(), tokenProgram: compiled.programId
      };
    }
    if (tag === 12 && data.length >= 10) {
      const amount = u64le(data, 1);
      return {
        ...base, recognized: true, type: 'TOKEN_TRANSFER_CHECKED',
        source: compiled.accounts[0] ?? null,
        mint: compiled.accounts[1] ?? null,
        destination: compiled.accounts[2] ?? null,
        authority: compiled.accounts[3] ?? null,
        amountRaw: amount.toString(), decimals: data[9], tokenProgram: compiled.programId
      };
    }
    if (tag === 6) {
      return {
        ...base, recognized: true, sensitive: true, type: 'TOKEN_SET_AUTHORITY',
        target: compiled.accounts[0] ?? null,
        currentAuthority: compiled.accounts[1] ?? null,
        authorityType: data.length > 1 ? data[1] : null,
        tokenProgram: compiled.programId
      };
    }
    if (tag === 4) return { ...base, recognized: true, sensitive: true, type: 'TOKEN_APPROVE_DELEGATE', tokenProgram: compiled.programId };
    if (tag === 5) return { ...base, recognized: true, sensitive: true, type: 'TOKEN_REVOKE_DELEGATE', tokenProgram: compiled.programId };
    if (tag === 9) return { ...base, recognized: true, sensitive: true, type: 'TOKEN_CLOSE_ACCOUNT', tokenProgram: compiled.programId };
    return { ...base, recognized: true, type: `TOKEN_INSTRUCTION_${tag ?? 'MALFORMED'}`, tokenProgram: compiled.programId };
  }
  if (compiled.programId === ASSOCIATED_TOKEN_PROGRAM_ID) return { ...base, recognized: true, type: 'ASSOCIATED_TOKEN_INSTRUCTION' };
  if (compiled.programId === COMPUTE_BUDGET_PROGRAM_ID) return { ...base, recognized: true, type: 'COMPUTE_BUDGET_INSTRUCTION' };
  return base;
}

export function decodeInstructions(parsed) {
  return parsed.compiledInstructions.map((ix, i) => decodeInstruction(ix, i));
}
