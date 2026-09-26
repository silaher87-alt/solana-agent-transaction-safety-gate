# Solana Agent Transaction Safety Gate

An experimental, dependency-free **pre-signing inspection tool** for unsigned Solana transactions. It parses legacy and version-0 wire transactions, decodes selected System and SPL Token instructions, applies explicit deterministic policy rules, and returns `ALLOW`, `REVIEW`, or `BLOCK` with machine-readable evidence.

## Why this matters for AI agents

AI agents that prepare or initiate blockchain actions need a deterministic safety boundary between **intent** and **signing**. This project explores that boundary for Solana by giving an agent, wallet workflow, or orchestration layer a read-only inspection step before any signature is requested.

The gate is designed to make risky or ambiguous transaction state explicit rather than letting unsupported semantics silently pass. The long-term goal is a composable safety primitive that can be called by heterogeneous AI-agent systems without taking custody of keys or assets.

This repository is intentionally narrow: it is not an autonomous trading agent, wallet, custody layer, or transaction sender. It is a pre-signing evidence and policy component.

## Important safety boundary

This repository is deliberately non-custodial and read-only:

- no private-key or seed-phrase input;
- no wallet connection;
- no transaction signing;
- no transaction broadcasting;
- no asset movement;
- the local demo binds to `127.0.0.1` only;
- optional RPC simulation uses `simulateTransaction` only and an explicit RPC-host allowlist;
- unknown programs and unresolved address-lookup-table entries do not silently pass.

`ALLOW` means only that the transaction passed the configured checks implemented by this MVP. It is **not a guarantee that a transaction is safe** and should not be treated as a substitute for wallet controls, independent review, or protocol-specific analysis.

## Current status

MVP `0.1.0`. The included acceptance suite covers 12 bounded cases. The project is **not security audited** and has known decoding limitations described below.

The public MVP already includes:

- deterministic transaction parsing and policy evaluation;
- bounded decoding for selected System and SPL Token instructions;
- explicit `ALLOW`, `REVIEW`, and `BLOCK` decisions with structured reasons;
- transaction fingerprints and audit-oriented evidence fields;
- optional read-only simulation;
- a local-only demo UI and CLI;
- deterministic synthetic fixtures;
- threat model, security guidance, publication manifest, and MIT licence;
- static checks that the application source does not include selected signing, broadcast, private-key, or wallet-connection workflows.

## Acceptance coverage

The 12 bounded acceptance cases cover:

1. small allowlisted SOL transfer -> `ALLOW`;
2. SOL spend-cap breach -> `BLOCK`;
3. SPL Token transfer cap breach -> `BLOCK`;
4. non-allowlisted recipient -> `BLOCK`;
5. SPL Token authority change -> `BLOCK`;
6. unknown program -> never silently `ALLOW`;
7. simulation failure -> `BLOCK`;
8. malformed/unsupported transaction -> structured `BLOCK`;
9. deterministic decision and reason output;
10. required audit/evidence fields;
11. static no-signing/no-broadcast/private-key workflow check;
12. version-0 static-key transfer parsing.

Run them with:

```bash
npm test
npm run verify:no-signing
```

## Requirements

- Node.js 20+
- No npm runtime dependencies

## CLI

```bash
node cli.js --tx <BASE64_TRANSACTION> --policy config/example-policy.json
```

For optional read-only simulation against the default Solana devnet RPC:

```bash
node cli.js --tx <BASE64_TRANSACTION> --policy config/example-policy.json --simulate
```

**Privacy note:** simulation sends the supplied unsigned transaction bytes to the selected RPC endpoint. Do not simulate transaction material you do not want disclosed to that RPC provider.

## Local demo

```bash
npm run demo
```

Then open `http://127.0.0.1:8787`.

## Decision meanings

- `ALLOW` — no configured rule produced REVIEW or BLOCK.
- `REVIEW` — the tool found ambiguity, unsupported semantics, or a configured review condition.
- `BLOCK` — a configured blocking condition was detected or malformed input prevented safe analysis.

## Next funded phase

The next phase is focused on extending and validating an already-working public MVP rather than building a speculative prototype. Priorities are:

- safe resolution of version-0 address lookup tables;
- broader instruction coverage for high-value Solana programs;
- clearer policy composition and machine-readable rule provenance;
- adversarial and property-based test expansion;
- reproducible CI evidence for every pull request;
- integration examples for AI-agent/orchestration workflows;
- independent security review when the implementation reaches an appropriate scope.

See [`ROADMAP.md`](ROADMAP.md) and [`GRANT_PLAN.md`](GRANT_PLAN.md) for the bounded development plan.

## Current limitations

- Version-0 address lookup tables are structurally parsed, but loaded addresses are not fetched/resolved. Dependent instructions are surfaced for review rather than guessed.
- Only selected System and SPL Token instructions are semantically decoded.
- Plain SPL Token `Transfer` does not contain a mint in the instruction itself; the tool does not invent one.
- Unknown/custom program semantics are not reverse-engineered and default to `REVIEW`.
- Simulation is supplementary evidence and cannot prove economic safety.
- This MVP is not a wallet, firewall, signing service, custody system, or comprehensive Solana security product.

## Repository contents

- `src/` — parser, instruction decoders, policy engine, read-only simulation, local server
- `test/` — bounded acceptance tests
- `fixtures/` — deterministic synthetic transaction fixtures
- `config/` — example policy
- `web/` — minimal local-only demo UI
- `tools/verify-no-signing.js` — static guard against selected signing/broadcast workflow terms
- `THREAT_MODEL.md` — scope and failure assumptions
- `SECURITY.md` — reporting and safe-use guidance
- `ROADMAP.md` — next-phase technical roadmap
- `GRANT_PLAN.md` — funder-facing bounded development plan

## Contributing

Contributions that preserve the read-only, non-custodial safety boundary are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

MIT. See `LICENSE`.
