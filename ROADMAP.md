# Roadmap

This roadmap is intentionally bounded. It extends the existing public MVP without changing its core non-custodial, read-only safety boundary.

## Phase 1 — Evidence and reproducibility

- Run the acceptance suite and no-signing guard in GitHub Actions on every push and pull request.
- Preserve machine-readable test output where practical.
- Expand fixtures for malformed, ambiguous, and adversarial transaction shapes.
- Add regression coverage for every fixed parser/policy bug.

**Exit condition:** every change is automatically checked against the existing safety boundary and bounded acceptance suite.

## Phase 2 — Version-0 address lookup table resolution

- Add read-only lookup-table resolution behind an explicit RPC-host allowlist.
- Treat unavailable, malformed, or inconsistent lookup-table data as `REVIEW` or `BLOCK` according to policy rather than guessing.
- Extend evidence output so resolved and unresolved account provenance is visible.

**Exit condition:** version-0 transactions that rely on address lookup tables can be inspected without silently trusting unresolved addresses.

## Phase 3 — Broader instruction coverage

Prioritise high-value, well-specified Solana program semantics where deterministic decoding materially improves safety.

Candidate areas include:

- additional SPL Token / Token-2022 instructions;
- associated token account operations;
- common system-level authority or account-management operations;
- narrowly selected DeFi or agent-relevant program actions where semantics can be validated reliably.

Unknown or unsupported semantics must continue to fail safe into `REVIEW` rather than silently passing.

**Exit condition:** broader useful coverage without weakening unknown-program handling.

## Phase 4 — Policy composition and provenance

- Make policy rule origin/version explicit in machine-readable output.
- Support composable policy profiles while preserving deterministic evaluation.
- Add examples for spend caps, allowlists, authority changes, program restrictions, and review-only rules.

**Exit condition:** users can understand not only the decision, but which versioned rule produced it.

## Phase 5 — Agent integration examples

Provide small, provider-neutral examples showing how an AI agent or orchestration layer can:

1. construct or receive an unsigned transaction;
2. call the safety gate;
3. inspect the structured evidence;
4. stop on `BLOCK`;
5. escalate `REVIEW` to a human or separate policy process;
6. pass `ALLOW` onward without the gate itself signing or broadcasting anything.

**Exit condition:** a third-party agent developer can integrate the gate without introducing custody or signing into this repository.

## Phase 6 — Security hardening

- Property-based and fuzz testing for transaction parsing boundaries.
- Adversarial fixture expansion.
- Dependency/security review (the runtime currently has no npm dependencies).
- Independent security review once feature scope is stable enough to audit meaningfully.

**Exit condition:** documented external review findings and remediation plan.

## Non-goals

This roadmap does not turn the project into:

- a wallet;
- a custody provider;
- a private-key manager;
- a transaction signer;
- a transaction broadcaster;
- an autonomous trading system;
- a guarantee that any transaction is economically safe.

Those boundaries are intentional and should remain explicit in future contributions.
