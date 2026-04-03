const { exec } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const EventEmitter = require('events');

/**
 * Watcher component to detect "access attempts" in File Explorer.
 * It uses a combination of window title monitoring (PowerShell) 
 * and directory watching (chokidar).
 */
class FolderWatcher extends EventEmitter {
    constructor() {
        super();
        this.protectedItems = [];
        this.interval = null;
        this.chokidarWatcher = null;
    }

    /**
     * Start watching for activity on protected items.
     */
    start(protectedItems) {
        this.protectedItems = protectedItems;
        this.stop();

        // 1. Start Window Title Monitoring
        this.interval = setInterval(() => this.checkForegroundWindow(), 1000);

        // 2. Start Chokidar Watcher on Parent Directories
        const parentDirs = [...new Set(this.protectedItems.map(i => path.dirname(i.path)))];
        if (parentDirs.length > 0) {
            this.chokidarWatcher = chokidar.watch(parentDirs, {
                ignoreInitial: true,
                depth: 1
            });

            this.chokidarWatcher.on('all', (event, filePath) => {
                const target = this.protectedItems.find(i => filePath.toLowerCase().includes(i.path.toLowerCase()));
                if (target && target.status === 'locked') {
                    this.emit('access-attempt', target);
                }
            });
        }
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        if (this.chokidarWatcher) this.chokidarWatcher.close();
    }

    /**
     * Set the list of items to watch.
     */
    updateFolders(items) {
        this.protectedItems = items;
        this.start(items);
    }

    /**
     * Uses PowerShell to check the active window title.
     * Matches both Folders and Files (by name/path).
     */
    async checkForegroundWindow() {
        const psScript = `
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                using System.Text;
                public class Win32 {
                    [DllImport("user32.dll")]
                    public static extern IntPtr GetForegroundWindow();
                    [DllImport("user32.dll", CharSet = CharSet.Auto)]
                    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
                }
"@; 
            $hWnd = [Win32]::GetForegroundWindow();
            $sb = New-Object System.Text.StringBuilder 256;
            [Win32]::GetWindowText($hWnd, $sb, $sb.Capacity) | Out-Null;
            $sb.ToString()
        `.replace(/\n/g, '');

        exec(`powershell -Command "${psScript}"`, (err, stdout) => {
            if (err) return;
            const title = stdout.trim();
            if (!title) return;

            const match = this.protectedItems.find(i => 
                i.status === 'locked' && (
                    title.toLowerCase().includes(i.name.toLowerCase()) ||
                    title.toLowerCase().includes(i.path.toLowerCase())
                )
            );

            if (match) {
                this.emit('access-attempt', match);
            }
        });
    }
}

module.exports = new FolderWatcher();
