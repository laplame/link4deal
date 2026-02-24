const crypto = require('crypto');

function key() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('QR_PREFIX=LINK4DEAL-DISCOUNT');
console.log('QR_VERSION=v1');
console.log(`QR_ENC_KEY=${key()}`);
console.log(`QR_SIGN_KEY=${key()}`);
console.log('QR_TTL_SECONDS=300');
