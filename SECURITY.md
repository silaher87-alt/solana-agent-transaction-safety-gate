# Security

This project is experimental and has not undergone an independent security audit.

## Safe-use rules

- Never enter a seed phrase, private key, signing secret, or wallet credential. The project has no use for them.
- Treat `ALLOW` as "passed the implemented policy checks", not as a safety guarantee.
- Prefer deterministic fixtures or devnet while evaluating the MVP.
- Enabling simulation sends unsigned transaction bytes to the selected RPC provider.
- Keep signing and broadcasting in a separate system.

## Vulnerability reports

If you discover a security issue, avoid posting secrets, private transaction material, or exploitable user data in a public issue. Use the repository owner's private security-reporting channel if one is configured; otherwise provide a minimal non-sensitive reproduction.
