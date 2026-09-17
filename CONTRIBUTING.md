# Contributing

Small, reviewable changes are welcome.

Please keep the project within its non-custodial boundary: contributions must not add private-key handling, wallet credential storage, automatic signing, or transaction broadcasting.

Before proposing a change, run:

```bash
npm test
npm run verify:no-signing
```

New decoders or policy rules should include deterministic fixtures and tests, and unsupported/ambiguous cases should fail closed to `REVIEW` or `BLOCK` rather than being guessed.
