# Grant Development Plan

## Project

**Solana Agent Transaction Safety Gate** is a public, MIT-licensed, dependency-free pre-signing inspection tool for unsigned Solana transactions. It already parses legacy and version-0 transactions, decodes selected System and SPL Token instructions, applies deterministic policy rules, and returns `ALLOW`, `REVIEW`, or `BLOCK` with machine-readable evidence.

The project is deliberately read-only and non-custodial. It does not accept private keys, connect wallets, sign transactions, broadcast transactions, or move assets.

## Why funding is useful now

The public MVP exists and has a bounded 12-case acceptance suite. Funding would be used to extend coverage, improve reproducibility, harden parsing and policy behavior, and make the tool easier for AI-agent builders to integrate safely.

The goal is not to fund a speculative idea from zero. It is to develop and validate an already-working open-source safety primitive.

## Proposed funded work

### Workstream 1 — Reproducible validation

- Continuous integration for tests and no-signing checks.
- Expanded malformed/adversarial fixtures.
- Regression tests for parser and policy defects.

### Workstream 2 — Version-0 lookup-table safety

- Read-only address lookup table resolution behind explicit RPC controls.
- Evidence showing resolved/unresolved account provenance.
- Fail-safe behavior on missing or inconsistent lookup data.

### Workstream 3 — Broader deterministic decoding

- Additional SPL Token / Token-2022 safety-relevant instructions.
- Other narrowly selected high-value Solana program semantics where decoding can be implemented and tested deterministically.
- Preserve `REVIEW` for unknown semantics.

### Workstream 4 — Policy provenance

- Versioned/composable policy profiles.
- Machine-readable evidence identifying which rule produced each decision.
- Example agent policies for spend caps, allowlists, authority changes and unsupported programs.

### Workstream 5 — AI-agent integration

- Provider-neutral examples showing how agents can call the gate before signing.
- Clear escalation semantics: `BLOCK` stops, `REVIEW` escalates, `ALLOW` permits the surrounding workflow to continue without the gate taking custody.
- Integration documentation for multi-agent/orchestration systems.

### Workstream 6 — Security hardening

- Fuzz/property testing around transaction parsing boundaries.
- Threat-model updates as coverage grows.
- Independent security review when implementation scope is stable enough for meaningful audit.

## Measurable outputs

A funded phase should produce concrete public artifacts rather than vague research output:

- expanded open-source code and tests;
- CI evidence on every pull request;
- documented new instruction coverage;
- deterministic fixtures and regression cases;
- versioned policy examples;
- agent-integration examples;
- updated threat model and security documentation;
- a final public report describing what was added, tested, and still unsupported.

## Funding use

Suitable funding or compute support could be used for:

- engineering time;
- test infrastructure;
- RPC/compute costs for bounded validation;
- fuzzing/property-testing infrastructure;
- independent security review;
- documentation and integration examples.

## Safety and scope commitments

Any funded work should preserve these boundaries:

- no custody;
- no private-key handling;
- no signing;
- no broadcasting;
- no autonomous asset movement;
- no claim that `ALLOW` guarantees economic safety;
- unsupported semantics remain explicit and fail safe rather than being guessed.

## Open-source status

The current MVP is publicly available under the MIT licence. Funding would support continued public development of this safety component rather than a closed implementation.
