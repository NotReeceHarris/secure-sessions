'use strict';

/**
 * Encryption Dependencies
 *
 * This code includes the necessary encryption dependencies required for AES, Twofish, and cryptographic operations.
 *
 * @requires ./lib/aes
 * @requires ./lib/twofish
 * @requires crypto
 */
const aes = require('./lib/aes')
const twofish = require('./lib/twofish')
const crypto = require('crypto')

/**
 * Data Encryption and Hash Functions
 *
 * This code defines functions for data encryption, decryption, and hashing.
 *
 * @function encrypt
 * @param {Buffer} data - Data to be encrypted.
 * @param {Object} config - Configuration object including keys and initialization vectors.
 * @returns {Buffer} - Encrypted data.
 *
 * @function decrypt
 * @param {Buffer} data - Data to be decrypted.
 * @param {Object} config - Configuration object including keys and initialization vectors.
 * @returns {Buffer} - Decrypted data.
 *
 * @function hash
 * @param {string} data - Data to be hashed.
 * @returns {string} - Hashed data as a hexadecimal string.
 */
const encrypt = (data, config) => aes.encrypt(twofish.encrypt(data, config.keys[0], config.ivs[0]), config.keys[1], config.ivs[1])
const decrypt = (data, config) => twofish.decrypt(aes.decrypt(data, config.keys[1], config.ivs[1]), config.keys[0], config.ivs[0])
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex')

/**
 * Hash Bucket
 *
 * This variable stores hashes of sessions. It is used to prevent people from
 * forging sessions. The theory is that if a session hash is not present in
 * 'hashBucket', it was not created by the server.
 */
const hashBucket = [];

module.exports = (data) => {

    /**
     * Configuration Object
     *
     * This code defines a configuration object named 'config'. It contains various
     * settings for the application. These settings include an 'id' generated from
     * random bytes, cookie properties, 'lock' function, encryption keys, initialization
     * vectors (IVs), and additional data merged from an existing 'data' object.
     *
     * @type {Object}
     * @property {string} id - A random identifier generated from 250 random bytes.
     * @property {Object} cookie - Cookie configuration, including max age, httpOnly,
     * signed, sameSite, and secure settings.
     * @property {Function} lock - A function used for locking based on the remote address.
     * @property {string[]} keys - An array of encryption keys generated from random bytes.
     * @property {string[]} ivs - An array of initialization vectors (IVs) generated from
     * random bytes.
     * @property {...*} data - Additional data merged into the configuration object.
     */
    const config = {
        'id': crypto.randomBytes(250).toString('hex'),
        'cookie': { maxAge: 10*1000*3600*24, httpOnly: true, signed: true, sameSite: 'strict', secure: true },
        'signed': true,
        'lock': (req) => req.socket.remoteAddress,
        'keys': [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
        'ivs': [crypto.randomBytes(16).toString('hex'), crypto.randomBytes(16).toString('hex')],
        ...data,
    }

    return (req, res, next) => {

        res.session = (data=null) => {
            if (req.cookies === undefined) {
                throw new Error('Session Manager Error: No cookies package found in the request. Make sure to use a cookies package before initializing the session manager.')
            }

            if (typeof data !== 'object' && data === null || !Array.isArray(data) && data === null) {
                throw new Error('Invalid session data. You must provide an object or null for session storage.')
            }

            try {
                JSON.stringify(data)
            } catch (error) {
                throw new Error("Failed to stringify session data. Make sure the 'data' parameter is a valid JSON-serializable object.");
            }

            if (config.id in req.cookies || config.id in req.signedCookies) {
                const cookieValue = config.signed ? req.signedCookies[config.id] : req.cookies[config.id];
            
                if (cookieValue) {
                    const originalHash = hash(cookieValue);
            
                    if (hashBucket.includes(originalHash)) {
                        try {
                            const decrypted = decrypt(cookieValue, config);
                            const cookieData = JSON.parse(decrypted);
                            cookieData.data = data;
                            cookieData.updated = new Date();
                            const encryptedCookie = encrypt(JSON.stringify(cookieData), config);
            
                            hashBucket.push(hash(encryptedCookie));
                            hashBucket.splice(hashBucket.indexOf(originalHash), 1);
            
                            return res.cookie(config.id, encryptedCookie, config.cookie);
                        } catch (error) {
                            console.error('Error while updating session: ' + error.message);
                        }
                    }
                }
            }

            data = {
                data: data,
                created: new Date(),
                updated: new Date(),
                lock: config.lock(req)
            }

            const encryptedCookie = encrypt(JSON.stringify(data), config)
            hashBucket.push(hash(encryptedCookie))
            return res.cookie(config.id, encryptedCookie, config.cookie);
        }

        /**
         * Session Manager Configuration
         *
         * This code defines a function that configures a session manager for Express.js.
         * It checks for the presence of cookies and handles decryption and locking of the session data.
         *
         * @function
         * @returns {Object|null} The session data or null if not found or invalid.
         * @throws {Error} If cookies are not available before using the session manager.
         */
        req.session = () => {
            if (req.cookies === undefined) {
                throw new Error('You must use a cookies package before session manager.')
            }

            var output = null
            if (config.signed) {
                if (!(config.id in req.signedCookies)) {
                    output = null
                } else {
                    if (!hashBucket.includes(hash(req.signedCookies[config.id]))) {
                        return null
                    }
                    try {
                        const decrypted = decrypt(req.signedCookies[config.id], config)
                        output = JSON.parse(decrypted)
                    } catch (error) {
                        output = null
                    }
                }
                
            } else {
                if (!(config.id in req.cookies)) {
                    output = null
                } else {
                    if (!hashBucket.includes(hash(req.cookies[config.id]))) {
                        return null
                    }
                    try {
                        const decrypted = decrypt(req.cookies[config.id], config)
                        output = JSON.parse(decrypted)
                    } catch (error) {
                        output = null
                    }
                }
            }

            if (output === null) {
                return null
            }

            if (config.lock) {
                if (output.lock !== config.lock(req)) {
                    return null
                }
            }

            return output
        }

        next()
    }
}