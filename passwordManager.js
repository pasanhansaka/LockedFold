const keytar = require('keytar');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SERVICE_NAME = 'FolderGuard';
const DATA_FILE = path.join(os.homedir(), '.folderguard', 'protectedItems.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

/**
 * Manages secure password storage and item metadata.
 */
class PasswordManager {
    /**
     * Get the master password from DPAPI.
     */
    async getMasterPassword() {
        return await keytar.getPassword(SERVICE_NAME, 'master');
    }

    /**
     * Set the master password in DPAPI.
     */
    async setMasterPassword(password) {
        await keytar.setPassword(SERVICE_NAME, 'master', password);
    }

    /**
     * Get password for a specific item.
     */
    async getItemPassword(itemPath) {
        return await keytar.getPassword(SERVICE_NAME, `item:${itemPath}`);
    }

    /**
     * Set password for a specific item.
     */
    async setItemPassword(itemPath, password) {
        await keytar.setPassword(SERVICE_NAME, `item:${itemPath}`, password);
    }

    /**
     * Remove password for a specific item.
     */
    async removeItemPassword(itemPath) {
        await keytar.deletePassword(SERVICE_NAME, `item:${itemPath}`);
    }

    /**
     * Get the list of protected items from JSON.
     */
    getProtectedItems() {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    /**
     * Save the list of protected items to JSON.
     */
    saveProtectedItems(items) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
    }

    /**
     * Add an item to the list.
     */
    async addItem(itemPath, type, password, permissions = ['F'], isEncrypted = false) {
        const items = this.getProtectedItems();
        if (items.find(i => i.path === itemPath)) return false;

        const name = path.basename(itemPath);
        items.push({
            path: itemPath,
            name: name,
            type: type, // 'file' or 'folder'
            status: 'locked',
            permissions: permissions, // e.g. ['R', 'W', 'D']
            isEncrypted: isEncrypted,
            dateAdded: new Date().toISOString()
        });

        await this.setItemPassword(itemPath, password);
        this.saveProtectedItems(items);
        return true;
    }

    /**
     * Remove an item from the list.
     */
    async removeItem(itemPath) {
        let items = this.getProtectedItems();
        items = items.filter(i => i.path !== itemPath);
        await this.removeItemPassword(itemPath);
        this.saveProtectedItems(items);
    }

    /**
     * Update item status.
     */
    updateItemStatus(itemPath, status) {
        const items = this.getProtectedItems();
        const item = items.find(i => i.path === itemPath);
        if (item) {
            item.status = status;
            this.saveProtectedItems(items);
        }
    }
}

module.exports = new PasswordManager();
