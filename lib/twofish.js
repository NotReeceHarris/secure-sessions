const os = require('os');
const v = process.versions.node.split('.')[0]

if (os.platform() == 'win32') {  
    if (os.arch() == 'ia32') var chilkat = require(`@chilkat/ck-node${v}-win-ia32`);
    else var chilkat = require(`@chilkat/ck-node${v}-win64`); 
} else if (os.platform() == 'linux') {
    if (os.arch() == 'arm') var chilkat = require(`@chilkat/ck-node${v}-arm`);
    else if (os.arch() == 'x86') var chilkat = require(`@chilkat/ck-node${v}-linux32`);
    else var chilkat = require(`@chilkat/ck-node${v}-linux64`);
} else if (os.platform() == 'darwin') var chilkat = require(`@chilkat/ck-node${v}-macosx`);

const crypt = new chilkat.Crypt2();
crypt.CryptAlgorithm = "twofish";
crypt.CipherMode = "cbc";
crypt.KeyLength = 256;
crypt.PaddingScheme = 0;
crypt.EncodingMode = "hex";

function encrypt(data, key, iv) {
    crypt.SetEncodedIV(iv,"hex");
    crypt.SetEncodedKey(key,"hex");
    const encryptedData = crypt.EncryptStringENC(data);
    return encryptedData;
}

function decrypt(data, key, iv) {
    crypt.SetEncodedIV(iv,"hex");
    crypt.SetEncodedKey(key,"hex");
    const decryptedData = crypt.DecryptStringENC(data);
    return decryptedData;
}


module.exports = {encrypt, decrypt}