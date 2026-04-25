import { readFileSync } from 'fs';

function readEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=')+1).trim()])
    );
  } catch { return {}; }
}

const env = readEnv('.env.local');
const NEYNAR_API_KEY = env.NEYNAR_API_KEY;
const SIGNER_UUID = env.NEYNAR_SIGNER_UUID;

if (!SIGNER_UUID) {
  console.error('❌ NEYNAR_SIGNER_UUID not in .env.local yet');
  process.exit(1);
}

const res = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${SIGNER_UUID}`, {
  headers: { 'api_key': NEYNAR_API_KEY, 'accept': 'application/json' }
});
const data = await res.json();
console.log('Status:', data.status);
if (data.status === 'approved') {
  console.log('✅ Signer is APPROVED — you are ready to cast!');
} else {
  console.log('⏳ Not approved yet. Open the Warpcast deep link and tap Approve.');
  console.log('Full response:', JSON.stringify(data, null, 2));
}
