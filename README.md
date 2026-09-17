# Solana Agent Transaction Safety Gate

An experimental, dependency-free **pre-signing inspection tool** for unsigned Solana transactions. It parses legacy and version-0 wire transactions, decodes selected System and SPL Token instructions, applies explicit deterministic policy rules, and returns `ALLOW`, `REVIEW`, or `BLOCK` with machine-readable evidence.

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

## Requirements

- Node.js 20+
- No npm runtime dependencies

## Run tests

```bash
npm test
npm run verify:no-signing
```

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

## License

MIT. See `LICENSE`.
