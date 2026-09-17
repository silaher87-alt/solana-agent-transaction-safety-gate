const ALLOWED_HOSTS = new Set(['api.devnet.solana.com','api.mainnet.solana.com','api.testnet.solana.com','localhost','127.0.0.1']);

function validateRpcUrl(text) {
  const url = new URL(text);
  if (!['https:','http:'].includes(url.protocol)) throw new Error('RPC URL must be HTTP(S)');
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error(`RPC host not permitted by MVP allowlist: ${url.hostname}`);
  if (url.protocol === 'http:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Plain HTTP only allowed for localhost');
  return url.toString();
}

export async function simulateTransactionReadOnly(base64Transaction, rpcUrl = 'https://api.devnet.solana.com') {
  const endpoint = validateRpcUrl(rpcUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'simulateTransaction',
        params: [base64Transaction, { encoding: 'base64', sigVerify: false, replaceRecentBlockhash: true, innerInstructions: true, commitment: 'processed' }]
      })
    });
    if (!response.ok) return { status: 'error', error: `HTTP_${response.status}` };
    const body = await response.json();
    if (body.error) return { status: 'error', error: body.error };
    const value = body?.result?.value;
    if (!value) return { status: 'error', error: 'MISSING_SIMULATION_VALUE' };
    if (value.err) return { status: 'error', error: value.err, logs: value.logs ?? null, unitsConsumed: value.unitsConsumed ?? null };
    return { status: 'ok', error: null, logs: value.logs ?? null, unitsConsumed: value.unitsConsumed ?? null, returnData: value.returnData ?? null };
  } catch (error) {
    return { status: 'unavailable', error: error?.name === 'AbortError' ? 'RPC_TIMEOUT' : String(error?.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}
