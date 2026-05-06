const crypto = require('crypto');

const partnerId = '2033681';
const partnerKey = 'shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c';

const ts = Math.floor(Date.now() / 1000);
const path = '/api/v2/shop/auth_partner';
const redirect = 'https://rayshopee.localhost/api/auth/callback';

const sign = crypto.createHmac('sha256', partnerKey)
  .update(partnerId + path + ts.toString())
  .digest('hex');

const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&redirect=${encodeURIComponent(redirect)}&timestamp=${ts}&sign=${sign}`;

console.log('='.repeat(70));
console.log('URL PARA AUTORIZAR:');
console.log('='.repeat(70));
console.log(url);
console.log('='.repeat(70));
console.log('');
console.log('COPIA TODO O TEXTO ACIMA E COLA NO NAVEGADOR');