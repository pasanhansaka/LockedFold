const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, shell } = require('electron');
const path = require('path');
const passwordManager = require('./passwordManager');
const lockManager = require('./lockManager');
const encryptionManager = require('./encryptionManager');
const watcher = require('./watcher');

let mainWindow;
let popupWindow;
let tray = null;
let isQuitting = false;

// Relock timer storage
const relockTimers = {};

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        backgroundColor: '#0f0f1a',
        show: false,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/dashboard/index.html');

    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

function createPopupWindow() {
    popupWindow = new BrowserWindow({
        width: 400,
        height: 500,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        show: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    popupWindow.loadFile('src/popup/popup.html');
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open FolderGuard v2.0', click: () => mainWindow.show() },
        { label: 'System Lockdown', click: async () => {
            const items = passwordManager.getProtectedItems();
            for (const item of items) {
                await lockManager.lock(item.path, item.permissions);
                passwordManager.updateItemStatus(item.path, 'locked');
            }
            if (mainWindow) mainWindow.webContents.send('refresh-items');
        }},
        { type: 'separator' },
        { label: 'Exit', click: () => {
            isQuitting = true;
            app.quit();
        }}
    ]);
    tray.setToolTip('FolderGuard - Industrial Protection');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
}

app.whenReady().then(async () => {
    const items = passwordManager.getProtectedItems();
    watcher.start(items);

    createWindow();
    createPopupWindow();
    createTray();

    watcher.on('access-attempt', (item) => {
        if (popupWindow && !popupWindow.isVisible()) {
            popupWindow.webContents.send('show-popup', item);
            popupWindow.show();
            popupWindow.center();
        }
    });
});

// IPC Handlers v2.0
ipcMain.handle('get-items', () => {
    return passwordManager.getProtectedItems();
});

ipcMain.handle('select-item', async (event, type) => {
    const properties = type === 'folder' ? ['openDirectory'] : ['openFile'];
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties });
    if (canceled) return null;
    return filePaths[0];
});

ipcMain.handle('save-item', async (event, { itemPath, type, password, permissions, isEncrypted }) => {
    const success = await passwordManager.addItem(itemPath, type, password, permissions, isEncrypted);
    if (success) {
        // 1. Encrypt if requested
        if (isEncrypted) {
            if (type === 'folder') await encryptionManager.processFolder(itemPath, password, 'encrypt');
            else await encryptionManager.encryptFile(itemPath, password);
        }
        // 2. Lock with permissions
        await lockManager.lock(itemPath, permissions);
        watcher.updateFolders(passwordManager.getProtectedItems());
    }
    return success;
});

ipcMain.handle('unlock-item', async (event, { path: itemPath, password }) => {
    const storedHash = await passwordManager.getItemPassword(itemPath);
    if (storedHash === password) {
        const items = passwordManager.getProtectedItems();
        const item = items.find(i => i.path === itemPath);

        // 1. Remove OS Lock
        await lockManager.unlock(itemPath);

        // 2. Decrypt if needed
        if (item && item.isEncrypted) {
            if (item.type === 'folder') await encryptionManager.processFolder(itemPath, password, 'decrypt');
            else await encryptionManager.decryptFile(itemPath + '.fg', password);
        }

        passwordManager.updateItemStatus(itemPath, 'unlocked');
        shell.openPath(itemPath);

        // Auto-relock (30s)
        if (relockTimers[itemPath]) clearTimeout(relockTimers[itemPath]);
        relockTimers[itemPath] = setTimeout(async () => {
            if (item.isEncrypted) {
                if (item.type === 'folder') await encryptionManager.processFolder(itemPath, password, 'encrypt');
                else await encryptionManager.encryptFile(itemPath, password);
            }
            await lockManager.lock(itemPath, item.permissions);
            passwordManager.updateItemStatus(itemPath, 'locked');
            if (mainWindow) mainWindow.webContents.send('refresh-items');
            delete relockTimers[itemPath];
        }, 30000);

        return { success: true };
    }
    return { success: false, message: 'Invalid Security Password' };
});

ipcMain.handle('lock-item', async (event, itemPath) => {
    const items = passwordManager.getProtectedItems();
    const item = items.find(i => i.path === itemPath);
    const password = await passwordManager.getItemPassword(itemPath);

    if (item.isEncrypted) {
        if (item.type === 'folder') await encryptionManager.processFolder(itemPath, password, 'encrypt');
        else await encryptionManager.encryptFile(itemPath, password);
    }
    
    await lockManager.lock(itemPath, item.permissions);
    passwordManager.updateItemStatus(itemPath, 'locked');
    return true;
});

ipcMain.handle('remove-item', async (event, itemPath) => {
    const items = passwordManager.getProtectedItems();
    const item = items.find(i => i.path === itemPath);
    const password = await passwordManager.getItemPassword(itemPath);

    await lockManager.unlock(itemPath);
    
    if (item && item.isEncrypted) {
        try {
            if (item.type === 'folder') await encryptionManager.processFolder(itemPath, password, 'decrypt');
            else await encryptionManager.decryptFile(itemPath + '.fg', password);
        } catch (e) { console.error('Decryption failed on remove', e); }
    }

    await passwordManager.removeItem(itemPath);
    watcher.updateFolders(passwordManager.getProtectedItems());
    return true;
});

ipcMain.on('close-popup', () => { popupWindow.hide(); });

// Auto-start
ipcMain.on('toggle-autostart', (event, value) => {
    app.setLoginItemSettings({
        openAtLogin: value,
        path: app.getPath('exe')
    });
});
