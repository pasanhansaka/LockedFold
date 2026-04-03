const { exec } = require('child_process');
const fs = require('fs');

/**
 * Executes shell commands to lock and unlock items.
 * Supports granular permissions (Read, Write, Delete) and File/Folder types.
 */
class LockManager {
    /**
     * Lock an item with specific permissions.
     * @param {string} itemPath 
     * @param {string[]} permissions - e.g. ['R', 'W', 'D'] or ['F']
     */
    async lock(itemPath, permissions = ['F']) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(itemPath)) {
                return reject(new Error('Target path does not exist.'));
            }

            // Map internal permission codes to icacls flags
            // R = Read/Execute, W = Write/Modify, D = Delete, F = Full
            const flagMap = {
                'R': 'R,RX,RD',
                'W': 'W,M,WA,WEA',
                'D': 'D,DE',
                'F': 'F'
            };

            const deniedFlags = permissions.map(p => flagMap[p] || p).join(',');
            
            // icacls command to deny Everyone (*S-1-1-0) chosen access
            // (OI)(CI) for inheritance (folders), (F) or others for files
            const lockCmd = `icacls "${itemPath}" /deny *S-1-1-0:(OI)(CI)(${deniedFlags})`;
            const hideCmd = `attrib +h +s "${itemPath}"`;

            exec(`${lockCmd} && ${hideCmd}`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Lock Error:', stderr);
                    return reject(new Error('Failed to lock item. Ensure you have administrative privileges.'));
                }
                resolve(stdout);
            });
        });
    }

    /**
     * Unlock an item by removing denies and unhiding it.
     */
    async unlock(itemPath) {
        return new Promise((resolve, reject) => {
            const unhideCmd = `attrib -h -s "${itemPath}"`;
            const unlockCmd = `icacls "${itemPath}" /remove:d *S-1-1-0`;

            exec(`${unhideCmd} && ${unlockCmd}`, (error, stdout, stderr) => {
                if (error && !stderr.toLowerCase().includes('successfully processed 0 files')) {
                    console.warn('Unlock Warning:', stderr);
                }
                resolve(stdout);
            });
        });
    }

    /**
     * Check if an item is accessible for reading.
     */
    isAccessible(itemPath) {
        try {
            fs.accessSync(itemPath, fs.constants.R_OK);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = new LockManager();
