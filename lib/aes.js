const crypto = require('crypto');

function encrypt(data, key, iv) {
  const aesCipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encryptedData = aesCipher.update(data, 'utf8', 'hex');
  encryptedData += aesCipher.final('hex');
  return encryptedData;
}

function decrypt(encryptedData, key, iv) {
  const aesDecipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decryptedData = aesDecipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += aesDecipher.final('utf8');
  return decryptedData;
}

module.exports = {encrypt, decrypt}