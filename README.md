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

## 🖼️ How It Works
User tries to open locked folder
↓
FolderGuard detects access attempt (chokidar watcher)
↓
Password popup appears instantly 🔒
↓
Correct password → folder unlocks & opens
Wrong password  → access denied ❌

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Electron.js |
| Backend Logic | Node.js |
| UI | HTML + CSS + JavaScript |
| Folder Watching | chokidar |
| Password Security | keytar (Windows Credential Store) |
| Folder Locking | Windows `icacls` + `attrib` commands |
| Packaging | electron-builder |

---

## 📦 Installation

### Prerequisites
- Windows 10 or 11
- [Node.js](https://nodejs.org) (LTS version)
- Git

### Clone & Run
```bash
# Clone the repository
git clone https://github.com/pasanhansaka/LockedFold.git
cd LockedFold

# Install dependencies
npm install

# Run the app
npm start
```

### Build as .exe
```bash
npm run build
# Output will be in the /dist folder
```

---

## 📁 Project Structure
FolderGuard/
├── main.js              # Electron main process & app entry point
├── watcher.js           # chokidar folder access watcher
├── lockManager.js       # Folder lock/unlock using icacls & attrib
├── passwordManager.js   # Secure password encryption via keytar
├── encryptionManager.js # Additional encryption utilities
├── package.json         # Project config & dependencies
└── src/
├── dashboard/       # Main app UI (HTML/CSS/JS)
└── popup/           # Password prompt popup window

---

## 🔐 Security

- Passwords are **never stored as plain text**
- Uses Windows **Credential Store** via `keytar` for secure storage
- Folder access is blocked at the **Windows permission level** using `icacls`
- Hidden folders use system-level `attrib` flags

---

## ⚠️ Important Notes

- **Run as Administrator** is required for folder locking to work (icacls needs elevated permissions)
- This app is designed for **Windows 10/11 only**
- Folders remain locked even after PC restart
- Always remember your password — there is no recovery option yet

---

## 🗺️ Roadmap

- [x] Basic folder lock/unlock
- [x] Password protection per folder
- [x] Background folder watcher
- [x] Password popup on access attempt
- [ ] Auto-relock timer (e.g. re-lock after 5 minutes)
- [ ] Master password for the app
- [ ] Fingerprint / Windows Hello support
- [ ] .exe installer release
- [ ] Auto-start on Windows boot

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Pasan Hansaka**  
GitHub: [@pasanhansaka](https://github.com/pasanhansaka)

---

<div align="center">
  <strong>⭐ If you find this useful, please star the repo!</strong>
</div>
