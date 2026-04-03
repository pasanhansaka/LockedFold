<div align="center">

# 🔒 FolderGuard

### Mobile-Style Folder Lock for Windows

**Lock your folders and get an instant password popup when anyone tries to access them —**  
**just like AppLock on mobile, but for Windows.**

![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-blue?style=flat-square&logo=windows)
![Electron](https://img.shields.io/badge/Built%20with-Electron.js-47848F?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)

</div>

---

## ✨ What is FolderGuard?

FolderGuard is a free, open-source Windows desktop application that lets you **password-protect any folder** on your PC. Unlike other folder lock tools where you have to open the app to unlock — FolderGuard watches your folders in the background and **automatically pops up a password prompt** the moment someone tries to access a locked folder from File Explorer or This PC.

Think of it like the **AppLock app on Android**, but for your Windows folders.

---

## 🚀 Features

- 🔒 **Lock any folder** with a password using Windows ACL permissions
- 👁️ **Hide folders** — locked folders become invisible in File Explorer
- 📱 **Mobile-like popup** — password prompt appears automatically when a locked folder is accessed
- 🔐 **Secure password storage** — passwords encrypted using `keytar` (Windows Credential Store)
- 👀 **Background watcher** — `chokidar` monitors folder access 24/7
- 🖥️ **System tray** — runs silently in the background
- 🎨 **Modern dark UI** — clean dashboard to manage all locked folders
- ⚡ **Lightweight** — built with Electron.js + Node.js

---
