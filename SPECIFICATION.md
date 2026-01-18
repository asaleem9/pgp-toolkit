# PGP Encryption/Decryption Web Tool Specification

## 1. Overview

### 1.1 Purpose
A web-based tool that enables users to encrypt and decrypt messages using PGP (Pretty Good Privacy) keys. The tool focuses exclusively on encryption and decryption operations—it does not generate new PGP keys.

### 1.2 Goals
- Provide a simple, secure interface for PGP encryption/decryption
- Build user trust through transparency and client-side processing
- Deliver an elegant, accessible user experience
- Require zero technical knowledge from end users

### 1.3 Out of Scope
- PGP key generation
- Key management/storage
- Key signing or web of trust features
- File encryption (text messages only in v1)
- User accounts or authentication

---

## 2. Security Requirements

### 2.1 Core Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Client-Side Only** | All cryptographic operations MUST execute entirely in the browser. No keys or plaintext messages are ever transmitted to any server. |
| **Zero Knowledge** | The server has zero knowledge of user data. The application should function as a static site. |
| **No Persistence** | No sensitive data (keys, messages) is stored in localStorage, sessionStorage, cookies, or any persistent storage. |
| **Memory Clearing** | Sensitive data should be cleared from memory when operations complete or when the user navigates away. |

### 2.2 Trust Indicators
The UI must clearly communicate security to users:

- **Visual Security Badge**: Prominent indicator showing "All processing happens in your browser"
- **No Network Activity**: During encryption/decryption, show that no network requests are made
- **Open Source**: Link to source code for verification
- **Subresource Integrity (SRI)**: All external scripts must use SRI hashes
- **Content Security Policy**: Strict CSP headers preventing XSS and data exfiltration

### 2.3 Technical Security Measures

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'none';
  img-src 'self' data:;
  frame-ancestors 'none';
  form-action 'none';
```

- HTTPS only (HSTS enabled)
- No external API calls
- No analytics or tracking scripts
- No third-party dependencies that could exfiltrate data
- Use well-audited cryptographic library (OpenPGP.js)

### 2.4 Input Validation
- Validate PGP key format before processing
- Sanitize all user inputs
- Limit message size to prevent DoS (recommend 1MB max)
- Clear error messages that don't leak sensitive information

---

## 3. User Flows

### 3.1 Encryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ENCRYPT MESSAGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Enter Recipient's Public Key                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Paste PGP PUBLIC key here...                        │    │
│  │                                                     │    │
│  │ -----BEGIN PGP PUBLIC KEY BLOCK-----                │    │
│  │ ...                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Upload Key File]                                           │
│                                                              │
│  Step 2: Enter Your Message                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Type your secret message here...                    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│              [ Encrypt Message ]                             │
│                                                              │
│  Step 3: Encrypted Output                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ -----BEGIN PGP MESSAGE-----                         │    │
│  │ ...                                                 │    │
│  │ -----END PGP MESSAGE-----                           │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Copy to Clipboard]  [Download as .asc]                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Encryption Steps:**
1. User navigates to Encrypt tab/page
2. User pastes recipient's public PGP key OR uploads .asc/.gpg file
3. System validates key format and displays key fingerprint/identity
4. User enters plaintext message
5. User clicks "Encrypt"
6. System encrypts message client-side using OpenPGP.js
7. Encrypted output displayed with copy/download options
8. User copies or downloads encrypted message

### 3.2 Decryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     DECRYPT MESSAGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Enter Your Private Key                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Paste PGP PRIVATE key here...                       │    │
│  │                                                     │    │
│  │ -----BEGIN PGP PRIVATE KEY BLOCK-----               │    │
│  │ ...                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Upload Key File]                                           │
│                                                              │
│  Step 2: Enter Passphrase (if key is protected)              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ••••••••••••                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 3: Paste Encrypted Message                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ -----BEGIN PGP MESSAGE-----                         │    │
│  │ ...                                                 │    │
│  │ -----END PGP MESSAGE-----                           │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Upload .asc File]                                          │
│                                                              │
│              [ Decrypt Message ]                             │
│                                                              │
│  Step 4: Decrypted Output                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Your secret message appears here...                 │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Copy to Clipboard]  [Clear All]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Decryption Steps:**
1. User navigates to Decrypt tab/page
2. User pastes their private PGP key OR uploads key file
3. System validates key format and prompts for passphrase if needed
4. User enters passphrase (if applicable)
5. User pastes encrypted message OR uploads .asc file
6. User clicks "Decrypt"
7. System decrypts message client-side
8. Decrypted plaintext displayed
9. "Clear All" button prominently displayed to wipe sensitive data

---

## 4. User Interface Design

### 4.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Every element serves a purpose. No decorative clutter. |
| **Trust** | Visual design conveys security and professionalism. |
| **Simplicity** | Users complete tasks with minimal cognitive load. |
| **Guidance** | Clear labels, helpful hints, and informative error states. |

### 4.2 Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  PGP Tool           [Encrypt] [Decrypt]    [About]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌────────────────────────────────────────────────────┐   │
│    │                                                    │   │
│    │              Main Content Area                     │   │
│    │         (Encrypt or Decrypt Form)                  │   │
│    │                                                    │   │
│    └────────────────────────────────────────────────────┘   │
│                                                              │
│    ┌────────────────────────────────────────────────────┐   │
│    │  🔒 All operations happen locally in your browser  │   │
│    │     Your keys and messages never leave your device │   │
│    └────────────────────────────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Open Source · Privacy Policy · How It Works                 │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Visual Design

**Color Palette:**
- Primary: Deep blue (#1a365d) - conveys trust and security
- Secondary: Slate gray (#64748b) - professional, readable
- Success: Green (#16a34a) - successful operations
- Warning: Amber (#d97706) - cautions and warnings
- Error: Red (#dc2626) - errors and alerts
- Background: Near-white (#f8fafc) - clean, minimal

**Typography:**
- Headings: Inter or system-ui, semi-bold
- Body: Inter or system-ui, regular
- Monospace: JetBrains Mono or Consolas for key/message display

**Components:**
- Textareas: Large, clear borders, adequate padding, monospace font
- Buttons: Clear visual hierarchy, obvious primary action
- Tabs: Simple, underline-style for Encrypt/Decrypt toggle
- Trust badge: Subtle but visible, positioned consistently

### 4.4 Responsive Design
- Mobile-first approach
- Single column layout on mobile
- Comfortable touch targets (minimum 44px)
- Full-width textareas on all screen sizes

### 4.5 Accessibility Requirements
- WCAG 2.1 AA compliance minimum
- Keyboard navigation for all interactions
- Screen reader compatible
- Sufficient color contrast ratios
- Focus indicators clearly visible
- Form labels properly associated
- Error messages announced to screen readers

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React or Vanilla JS | Minimal dependencies, fast loading |
| **Styling** | Tailwind CSS or vanilla CSS | Utility-first, small bundle |
| **Crypto** | OpenPGP.js | Well-audited, maintained, browser-compatible |
| **Build** | Vite or esbuild | Fast builds, tree-shaking |
| **Hosting** | Static hosting (Vercel, Netlify, GitHub Pages) | No server required |

### 5.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  React App                       │   │
│  │  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │  UI Layer   │  │   OpenPGP.js Library    │  │   │
│  │  │  Components │──│   (Client-side crypto)  │  │   │
│  │  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                           │                             │
│                     No network calls                    │
│                     for crypto ops                      │
└─────────────────────────────────────────────────────────┘
                            │
                    Static file fetch only
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Static File Server (CDN)                    │
│         index.html, bundle.js, styles.css               │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Key Components

```
src/
├── components/
│   ├── EncryptForm.tsx       # Encryption UI and logic
│   ├── DecryptForm.tsx       # Decryption UI and logic
│   ├── KeyInput.tsx          # Reusable key input component
│   ├── MessageInput.tsx      # Message textarea component
│   ├── OutputDisplay.tsx     # Results display with copy/download
│   ├── TrustBadge.tsx        # Security indicator component
│   └── Navigation.tsx        # Tab navigation
├── hooks/
│   ├── useEncrypt.ts         # Encryption logic hook
│   ├── useDecrypt.ts         # Decryption logic hook
│   └── useClipboard.ts       # Clipboard operations
├── utils/
│   ├── pgp.ts                # OpenPGP.js wrapper functions
│   ├── validation.ts         # Input validation utilities
│   └── sanitize.ts           # Memory clearing utilities
├── App.tsx
└── index.tsx
```

---

## 6. Error Handling

### 6.1 Error States

| Error Type | User Message | Technical Action |
|------------|--------------|------------------|
| Invalid public key | "This doesn't appear to be a valid PGP public key. Please check and try again." | Validate key format before processing |
| Invalid private key | "This doesn't appear to be a valid PGP private key. Please check and try again." | Validate key format before processing |
| Wrong passphrase | "Incorrect passphrase. Please try again." | Allow retry, don't reveal attempt count |
| Decryption failed | "Could not decrypt this message. Make sure you're using the correct private key." | Generic error, don't leak details |
| Message too large | "Message exceeds maximum size (1MB). Please use a smaller message." | Client-side size check before processing |

### 6.2 Error Display
- Inline errors below relevant input field
- Red border on invalid inputs
- Clear, actionable error messages
- No technical jargon or stack traces shown to users

---

## 7. Future Considerations (Post v1)

These features are intentionally out of scope for v1 but may be considered later:

- [ ] File encryption/decryption (not just text)
- [ ] Multiple recipient encryption
- [ ] Signature verification
- [ ] Message signing
- [ ] QR code generation for encrypted messages
- [ ] Browser extension version
- [ ] PWA with offline support
- [ ] Key fingerprint verification helper

---

## 8. Success Metrics

### 8.1 Functional Success
- [ ] Encryption works with valid RSA and ECC public keys
- [ ] Decryption works with valid private keys (with and without passphrase)
- [ ] All operations complete in under 3 seconds for typical message sizes
- [ ] Zero server-side data transmission during crypto operations

### 8.2 Security Success
- [ ] Passes security audit for XSS, CSRF, and injection attacks
- [ ] CSP headers properly configured
- [ ] No sensitive data in browser storage
- [ ] Source code auditable

### 8.3 Usability Success
- [ ] Users can complete encryption in under 60 seconds (first time)
- [ ] Users can complete decryption in under 60 seconds (first time)
- [ ] Zero reliance on documentation for basic flows
- [ ] Accessible to users with disabilities (WCAG 2.1 AA)

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **PGP** | Pretty Good Privacy - an encryption standard |
| **Public Key** | The key shared with others to encrypt messages to you |
| **Private Key** | The secret key used to decrypt messages sent to you |
| **Passphrase** | Password protecting a private key |
| **Armored Key** | Text-encoded version of a key (ASCII armor) |
| **OpenPGP.js** | JavaScript implementation of the OpenPGP standard |
| **CSP** | Content Security Policy - browser security mechanism |
| **SRI** | Subresource Integrity - hash verification for external resources |

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | Initial | Initial specification |
