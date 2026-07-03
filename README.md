# PGP Toolkit

A client-side PGP tool for encrypting, decrypting, signing, and verifying messages — right in your browser. Built on [OpenPGP.js](https://openpgpjs.org/).

Every cryptographic operation runs locally. There is no backend, no API, and no network request after the page loads.

## Features

- **Encrypt** messages to one or more recipients (up to 10), with an optional encrypt-to-self so you can read your own sent messages
- **Decrypt** messages with your private key, with passphrase support
- **Sign** messages as clear-signed documents or detached signatures
- **Verify** clear-signed messages and detached signatures, with signer key ID and timestamp
- **Generate** ECC (Curve25519, NIST P-256/384/521) or RSA (2048/3072/4096) key pairs with configurable expiration
- **Inspect** any public or private key: fingerprint, user IDs, subkeys, capabilities from key flags, and expiry warnings

## Security model

- **100% client-side.** All crypto happens in your browser via OpenPGP.js. A strict Content Security Policy (`connect-src 'none'`) blocks the page from making any network request — fonts included, which are self-hosted.
- **Nothing stored.** No cookies, no localStorage, no analytics. Form state lives in page memory only and is cleared when you switch tabs or close the page.
- **Size-limited inputs.** A 1MB cap on messages and uploaded files keeps the tab responsive.
- **Honest limits.** JavaScript can't guarantee memory is wiped — strings are immutable and garbage collection is opaque. If your threat model includes local memory forensics, use a native tool like GnuPG instead.

## Development

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # type-check + production build
npm run lint         # ESLint
npm run test         # unit tests (Vitest, watch mode)
npm run test:e2e     # end-to-end tests (Playwright)
```

Unit tests mock OpenPGP.js entirely; e2e tests run the real library in Chromium, Firefox, and WebKit against the dev server.

## Deploying

The repo includes a `vercel.json` with security headers (CSP, HSTS, frame denial). Any static host works — the build output in `dist/` is fully self-contained — but if your host doesn't send headers, the build also embeds the same CSP as a meta tag.
