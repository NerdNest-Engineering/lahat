/**
 * Secure Storage - Additional encryption layer for sensitive data
 * Provides optional encryption on top of OS keychain storage
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export class SecureStorage extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000,
      saltLength: 32,
      ivLength: 16,
      tagLength: 16,
      ...options
    };
    
    this.masterKey = null;
    this.isUnlocked = false;
  }

  /**
   * Initialize secure storage with master password
   * @param {string} masterPassword - Master password for encryption
   * @returns {Promise<boolean>} Success status
   */
  async initialize(masterPassword) {
    try {
      if (!masterPassword || typeof masterPassword !== 'string') {
        throw new Error('Master password is required');
      }

      // Derive master key from password
      this.masterKey = await this._deriveMasterKey(masterPassword);
      this.isUnlocked = true;

      this.emit('storage:unlocked');
      return true;
    } catch (error) {
      this.emit('storage:error', { operation: 'initialize', error });
      throw new Error(`Failed to initialize secure storage: ${error.message}`);
    }
  }

  /**
   * Lock the secure storage
   */
  lock() {
    this.masterKey = null;
    this.isUnlocked = false;
    this.emit('storage:locked');
  }

  /**
   * Check if storage is unlocked
   * @returns {boolean} Whether storage is unlocked
   */
  isStorageUnlocked() {
    return this.isUnlocked && this.masterKey !== null;
  }

  /**
   * Encrypt data
   * @param {string} plaintext - Data to encrypt
   * @param {string} additionalData - Optional additional authenticated data
   * @returns {Promise<string>} Encrypted data as base64 string
   */
  async encrypt(plaintext, additionalData = '') {
    if (!this.isStorageUnlocked()) {
      throw new Error('Secure storage is locked');
    }

    try {
      // Generate random IV and salt
      const iv = crypto.randomBytes(this.options.ivLength);
      const salt = crypto.randomBytes(this.options.saltLength);

      // Create cipher
      const cipher = crypto.createCipher(this.options.algorithm, this.masterKey);
      cipher.setAAD(Buffer.from(additionalData, 'utf8'));

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components
      const result = Buffer.concat([
        salt,
        iv,
        tag,
        encrypted
      ]);

      return result.toString('base64');
    } catch (error) {
      this.emit('storage:error', { operation: 'encrypt', error });
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data as base64 string
   * @param {string} additionalData - Optional additional authenticated data
   * @returns {Promise<string>} Decrypted plaintext
   */
  async decrypt(encryptedData, additionalData = '') {
    if (!this.isStorageUnlocked()) {
      throw new Error('Secure storage is locked');
    }

    try {
      // Parse encrypted data
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const salt = buffer.subarray(0, this.options.saltLength);
      const iv = buffer.subarray(this.options.saltLength, this.options.saltLength + this.options.ivLength);
      const tag = buffer.subarray(
        this.options.saltLength + this.options.ivLength,
        this.options.saltLength + this.options.ivLength + this.options.tagLength
      );
      const encrypted = buffer.subarray(this.options.saltLength + this.options.ivLength + this.options.tagLength);

      // Create decipher
      const decipher = crypto.createDecipher(this.options.algorithm, this.masterKey);
      decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      decipher.setAuthTag(tag);

      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.emit('storage:error', { operation: 'decrypt', error });
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate secure random string
   * @param {number} length - Length of random string
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   */
  generateSecureRandom(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    const bytes = crypto.randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Hash data using secure algorithm
   * @param {string} data - Data to hash
   * @param {string} salt - Optional salt
   * @returns {Promise<string>} Hash as hex string
   */
  async hash(data, salt = '') {
    try {
      const hash = crypto.createHash('sha256');
      hash.update(data + salt);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Password to verify
   * @param {string} hash - Hash to verify against
   * @param {string} salt - Salt used in hashing
   * @returns {Promise<boolean>} Whether password matches
   */
  async verifyPassword(password, hash, salt = '') {
    try {
      const passwordHash = await this.hash(password, salt);
      return crypto.timingSafeEqual(
        Buffer.from(passwordHash, 'hex'),
        Buffer.from(hash, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Derive master key from password
   * @param {string} password - Master password
   * @param {Buffer} salt - Optional salt (will generate if not provided)
   * @returns {Promise<Buffer>} Derived key
   */
  async _deriveMasterKey(password, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(this.options.saltLength);
    }

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.options.iterations,
        32, // 256 bits
        'sha512',
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            resolve(derivedKey);
          }
        }
      );
    });
  }

  /**
   * Generate key pair for asymmetric encryption
   * @returns {Object} Key pair with public and private keys
   */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt data with public key
   * @param {string} data - Data to encrypt
   * @param {string} publicKey - Public key in PEM format
   * @returns {string} Encrypted data as base64
   */
  encryptWithPublicKey(data, publicKey) {
    try {
      const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data, 'utf8'));
      return encrypted.toString('base64');
    } catch (error) {
      throw new Error(`Public key encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with private key
   * @param {string} encryptedData - Encrypted data as base64
   * @param {string} privateKey - Private key in PEM format
   * @returns {string} Decrypted data
   */
  decryptWithPrivateKey(encryptedData, privateKey) {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.privateDecrypt(privateKey, buffer);
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Private key decryption failed: ${error.message}`);
    }
  }

  /**
   * Create digital signature
   * @param {string} data - Data to sign
   * @param {string} privateKey - Private key in PEM format
   * @returns {string} Signature as base64
   */
  sign(data, privateKey) {
    try {
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      const signature = sign.sign(privateKey);
      return signature.toString('base64');
    } catch (error) {
      throw new Error(`Signing failed: ${error.message}`);
    }
  }

  /**
   * Verify digital signature
   * @param {string} data - Original data
   * @param {string} signature - Signature as base64
   * @param {string} publicKey - Public key in PEM format
   * @returns {boolean} Whether signature is valid
   */
  verify(data, signature, publicKey) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Securely wipe memory buffer
   * @param {Buffer} buffer - Buffer to wipe
   */
  secureWipe(buffer) {
    if (Buffer.isBuffer(buffer)) {
      buffer.fill(0);
    }
  }

  /**
   * Get encryption statistics
   * @returns {Object} Encryption statistics
   */
  getStats() {
    return {
      isUnlocked: this.isUnlocked,
      algorithm: this.options.algorithm,
      keyDerivation: this.options.keyDerivation,
      iterations: this.options.iterations,
      securityLevel: this._getSecurityLevel()
    };
  }

  /**
   * Assess security level based on configuration
   * @returns {string} Security level assessment
   */
  _getSecurityLevel() {
    if (this.options.iterations >= 100000) {
      return 'high';
    } else if (this.options.iterations >= 50000) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}