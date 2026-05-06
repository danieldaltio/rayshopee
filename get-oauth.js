import crypto from 'crypto';

const SHOPEE_PARTNER_ID = "2033681";
const SHOPEE_PARTNER_KEY = "shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c";

const redirectUrl = "http://localhost:3003/api/auth/callback";

// Generate authorization URL
const timestamp = Math.floor(Date.now() / 1000);
const apiPath = '/api/v2/auth/token/get';
const sign = crypto.createHmac('sha256', SHOPEE_PARTNER_KEY)
  .update(`${SHOPEE_PARTNER_ID}${apiPath}${timestamp}`)
  .digest('hex');

const authUrl = new URL(`https://partner.shopeemobile.com${apiPath}`);
authUrl.searchParams.set('partner_id', SHOPEE_PARTNER_ID);
authUrl.searchParams.set('redirect_url', redirectUrl);
authUrl.searchParams.set('timestamp', timestamp);
authUrl.searchParams.set('sign', sign);

console.log('='.repeat(60));
console.log('🔐 SHOPEE OAUTHORIZATION');
console.log('='.repeat(60));
console.log('\n1. Open this URL in your browser:');
console.log(authUrl.toString());
console.log('\n2. Authorize the app');
console.log('\n3. After authorization, you will be redirected to:');
console.log(redirectUrl);
console.log('\n4. Copy the URL you are redirected to and run:');
console.log('   node get-tokens.js <redirected_url>');
console.log('='.repeat(60));

// If URL provided as argument, parse tokens
if (process.argv[2]) {
  const callbackUrl = process.argv[2];
  console.log('\n📝 Parsing callback URL:', callbackUrl);
  
  const url = new URL(callbackUrl);
  const code = url.searchParams.get('code');
  const redirectUrlFromCallback = url.searchParams.get('redirect_url');
  
  if (code && redirectUrlFromCallback) {
    // Exchange code for tokens
    const timestamp2 = Math.floor(Date.now() / 1000);
    const apiPath2 = '/api/v2/auth/access_token/get';
    const baseString = `${SHOPEE_PARTNER_ID}${apiPath2}${timestamp2}${code}`;
    const sign2 = crypto.createHmac('sha256', SHOPEE_PARTNER_KEY).update(baseString).digest('hex');
    
    fetch(`https://partner.shopeemobile.com${apiPath2}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp2}&sign=${sign2}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        shop_id: parseInt("263124677")
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        console.log('❌ Error:', data);
      } else {
        console.log('\n✅ Tokens obtained!');
        console.log('Access Token:', data.response.access_token.substring(0, 30) + '...');
        console.log('Refresh Token:', data.response.refresh_token.substring(0, 30) + '...');
        
        // Save to tokens.json
        require('fs').writeFileSync('./tokens.json', JSON.stringify({
          access_token: data.response.access_token,
          refresh_token: data.response.refresh_token,
          expires_at: Date.now() + (data.response.expire_in_seconds * 1000)
        }, null, 2));
        
        console.log('\n💾 Saved to tokens.json');
        console.log('\nNow run: node sync-supabase.js');
      }
    });
  } else {
    console.log('❌ No code found in URL');
  }
}