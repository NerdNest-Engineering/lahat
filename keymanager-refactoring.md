## Overview

Lahat currently supports credentials for OpenAI and Anthropic via provider-specific UI blocks. These are hardcoded into the settings panel and accessed only within the context of app generation and logo rendering.

As we expand Lahat to support mini apps that require their own service credentials (e.g., AWS S3 keys for backup tools, database credentials for Postgres clients, etc.), we need a secure and centralized solution for managing and sharing these credentials across the app ecosystem.

---

## Problem

- Credentials are currently duplicated, siloed, and manually managed per use case.
- No generalized API or interface exists for mini apps to securely retrieve credentials.
- There's no centralized UI or vault where all credentials can be managed.

---

## Proposal: Implement a Centralized, Secure Credential Vault

We should adopt a general-purpose credential manager that:

- Stores all secrets securely using the native OS credential store via [`keytar`](https://github.com/atom/node-keytar)
- Exposes credentials through a **main process IPC handler**, never directly to the renderer
- Provides a **unified UI** in Lahat settings to manage (add/edit/delete/test) credentials
- Supports **namespacing** (e.g., `aws.default`, `claude.production`) to distinguish between use cases
- Allows **mini apps to request credentials by name** via a well-defined and limited API

---

## Technical Architecture

- Use `keytar` in the **main process** to securely store/retrieve credentials
- Define IPC handlers:
  ```js
  ipcMain.handle('get-credential', (event, service, account) =>
    keytar.getPassword(service, account)
  );

  ipcMain.handle('set-credential', (event, service, account, value) =>
    keytar.setPassword(service, account, value)
  );
  ```
- Mini apps will request credentials using a sandbox-safe wrapper like:
  ```js
  const creds = await window.lahat.getCredential('aws.default');
  ```
- Credential UI will allow setting:
  - Name (`aws.default`)
  - Value (encrypted & stored via `keytar`)
  - Optional description
  - Test connection function (if applicable)

---

## Benefits

- 🔐 **Security-first**: All credentials are encrypted and stored in the OS keychain, not the file system  
- 🔁 **Reusable**: Same credential (e.g., `aws.default`) can be used across multiple mini apps  
- 📦 **Extensible**: Easily supports additional providers without new UI logic for each one  
- 🧼 **Cleaner architecture**: Decouples credentials from mini app code and generator logic  

---

## Use Cases Unlocked

- ✅ AWS S3 Backup apps  
- ✅ Postgres/MySQL database clients  
- ✅ Future OAuth integrations (Google Drive, GitHub)  
- ✅ Local-only secrets for coordination between apps or missions  

---

## Next Steps

- [ ] Create `credentialStore.js` module using `keytar`
- [ ] Set up IPC handlers for `getCredential` / `setCredential`
- [ ] Add new Credential Manager section in Lahat Settings
- [ ] Refactor OpenAI and Anthropic credential handling to use new system
- [ ] Define sandbox-safe access layer for mini apps
- [ ] Optional: Add metadata support for expiration, test, last used, etc.

---

Let me know if you want this in `design.md` format or need a PR scaffold to get started.
