#!/usr/bin/env node
import fs from 'node:fs';
import { analyzeTransaction } from './src/analyze.js';

const args = process.argv.slice(2);
const get = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
if (args.includes('--help') || args.length === 0) {
  console.log('Usage: node cli.js --tx <base64> [--policy policy.json] [--simulate] [--rpc https://api.devnet.solana.com]');
  process.exit(0);
}
const tx = get('--tx');
const policyPath = get('--policy');
const policy = policyPath ? JSON.parse(fs.readFileSync(policyPath, 'utf8')) : {};
const result = await analyzeTransaction({ base64Transaction: tx, policy, simulate: args.includes('--simulate'), rpcUrl: get('--rpc') });
console.log(JSON.stringify(result, null, 2));
process.exit(result.decision === 'BLOCK' ? 2 : result.decision === 'REVIEW' ? 1 : 0);
