import { ed25519 } from '@noble/curves/ed25519';
import { readFileSync } from 'fs';

// Read .env.local manually - no dotenv needed
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
const NEYNAR_API_KEY = env.NEYNAR_API_KEY || process.env.NEYNAR_API_KEY;

if (!NEYNAR_API_KEY) {
  console.error('❌ NEYNAR_API_KEY not found in .env.local');
  process.exit(1);
}

// Step 1: Get FID for okgopika
console.log('🔍 Looking up FID for @okgopika...');
const userRes = await fetch(
  'https://api.neynar.com/v2/farcaster/user/search?q=okgopika&limit=1',
  { headers: { 'api_key': NEYNAR_API_KEY, 'accept': 'application/json' } }
);
const userData = await userRes.json();

if (!userRes.ok) {
  console.error('❌ User lookup failed:', JSON.stringify(userData));
  process.exit(1);
}

const user = userData?.result?.users?.[0];
if (!user) {
  console.error('❌ User not found. Response:', JSON.stringify(userData));
  process.exit(1);
}

const FID = user.fid;
console.log(`✅ Found @${user.username} — FID: ${FID}`);

// Step 2: Generate Ed25519 key pair
const privateKey = ed25519.utils.randomPrivateKey();
const publicKey = ed25519.getPublicKey(privateKey);
const privateHex = '0x' + Buffer.from(privateKey).toString('hex');
const publicHex  = '0x' + Buffer.from(publicKey).toString('hex');

console.log('\n=== SAVE THESE IN .env.local ===');
console.log(`FARCASTER_FID=${FID}`);
console.log(`FARCASTER_SIGNER_PRIVATE_KEY=${privateHex}`);
console.log(`FARCASTER_SIGNER_PUBLIC_KEY=${publicHex}`);
console.log('================================\n');

// Step 3: Register public key with Neynar
console.log('📝 Registering public key with Neynar...');
const signerRes = await fetch('https://api.neynar.com/v2/farcaster/signer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'api_key': NEYNAR_API_KEY },
  body: JSON.stringify({ public_key: publicHex })
});
const signerData = await signerRes.json();

if (!signerRes.ok || !signerData.signer_uuid) {
  console.error('❌ Signer registration failed:', JSON.stringify(signerData));
  process.exit(1);
}

const signerUuid = signerData.signer_uuid;
console.log(`✅ Signer created — UUID: ${signerUuid}`);

// Step 4: Get the Warpcast approval deep link
console.log('\n🔗 Getting Warpcast approval link...');
const deadline = Math.floor(Date.now() / 1000) + 86400; // 24h from now

const signedKeyRes = await fetch('https://api.neynar.com/v2/farcaster/signer/signed_key', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'api_key': NEYNAR_API_KEY },
  body: JSON.stringify({ signer_uuid: signerUuid, app_fid: FID, deadline })
});
const signedKeyData = await signedKeyRes.json();

if (!signedKeyRes.ok) {
  console.error('❌ Signed key request failed:', JSON.stringify(signedKeyData));
  process.exit(1);
}

const deepLink = signedKeyData.deep_link_url || signedKeyData.signer_approval_url;

console.log('\n======================================================');
console.log('📱 OPEN THIS LINK IN WARPCAST ON YOUR PHONE TO APPROVE');
console.log('======================================================');
console.log(deepLink);
console.log('======================================================\n');
console.log('Also add this to .env.local:');
console.log(`NEYNAR_SIGNER_UUID=${signerUuid}`);
console.log('\nAfter approving in Warpcast, run the verify script to confirm.');
