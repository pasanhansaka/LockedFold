const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Handles AES-256-CBC encryption and decryption for files and folders.
 */
class EncryptionManager {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.keySize = 32; // 256 bits
        this.ivSize = 16;  // 128 bits
    }

    /**
     * Derive a 32-byte key from a password.
     */
    deriveKey(password) {
        return crypto.createHash('sha256').update(password).digest();
    }

    /**
     * Encrypt a single file.
     */
    async encryptFile(filePath, password) {
        return new Promise((resolve, reject) => {
            const key = this.deriveKey(password);
            const iv = crypto.randomBytes(this.ivSize);
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            
            const input = fs.createReadStream(filePath);
            const output = fs.createWriteStream(filePath + '.fg');

            // Write IV at the beginning of the file
            output.write(iv);

            input.pipe(cipher).pipe(output);

            output.on('finish', () => {
                fs.unlinkSync(filePath); // Delete original
                resolve(filePath + '.fg');
            });

            output.on('error', reject);
            input.on('error', reject);
        });
    }

    /**
     * Decrypt a single file.
     */
    async decryptFile(encryptedPath, password) {
        return new Promise((resolve, reject) => {
            const key = this.deriveKey(password);
            const input = fs.createReadStream(encryptedPath);
            
            // Read IV from the beginning
            let iv;
            input.once('readable', () => {
                iv = input.read(this.ivSize);
                if (!iv) return reject(new Error('Invalid encrypted file.'));

                const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
                const originalPath = encryptedPath.replace(/\.fg$/, '');
                const output = fs.createWriteStream(originalPath);

                input.pipe(decipher).pipe(output);

                output.on('finish', () => {
                    fs.unlinkSync(encryptedPath); // Delete encrypted version
                    resolve(originalPath);
                });

                output.on('error', reject);
            });

            input.on('error', reject);
        });
    }

    /**
     * Recursively encrypt/decrypt items in a folder.
     */
    async processFolder(folderPath, password, mode = 'encrypt') {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const fullPath = path.join(folderPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                await this.processFolder(fullPath, password, mode);
            } else {
                if (mode === 'encrypt' && !file.endsWith('.fg')) {
                    await this.encryptFile(fullPath, password);
                } else if (mode === 'decrypt' && file.endsWith('.fg')) {
                    await this.decryptFile(fullPath, password);
                }
            }
        }
    }
}

module.exports = new EncryptionManager();
