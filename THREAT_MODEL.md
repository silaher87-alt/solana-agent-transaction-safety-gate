# Threat model

## Purpose

Help a human or agent operator inspect an **unsigned** Solana transaction before a separate wallet or signer makes any authorization decision.

## Assets protected

- operator awareness of what a proposed transaction contains;
- explicit policy boundaries for spend, recipients, authority changes, unknown programs, and unsupported structures;
- separation between inspection and signing/custody.

## Main threats considered

1. Hidden or excessive SOL/token transfer.
2. Recipient substitution.
3. Token authority/delegate changes.
4. Opaque or unknown program instructions.
5. Malformed transaction data causing parser confusion.
6. Address lookup tables hiding accounts not present in static keys.
7. Simulation failure being mistaken for safety.
8. Scope creep into wallet custody, signing, or broadcasting.
9. Accidental disclosure of unsigned transaction data to an RPC provider during optional simulation.

## Fail-closed / escalation behaviour

- malformed or unsupported input: `BLOCK`;
- spend cap exceeded: `BLOCK`;
- authority change: `BLOCK` by default;
- unknown program: `REVIEW` by default;
- unresolved lookup-table addresses: `REVIEW` by default;
- simulation error: `BLOCK` by default;
- required simulation unavailable: `REVIEW` or `BLOCK` according to policy.

## Trust assumptions

- policy configuration is supplied by a trusted operator;
- Node.js runtime and the local machine are not compromised;
- RPC responses, when simulation is enabled, are external evidence and may be unavailable or incomplete;
- decoded instruction support is intentionally incomplete and must not be treated as exhaustive.

## Explicit non-goals

No key custody, automated signing, transaction submission, MEV protection, wallet security, protocol-specific economic guarantees, exhaustive semantic decoding, or claim that an `ALLOW` result proves safety.
