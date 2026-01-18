# Contributing Guide

This document provides guidance for developers working on this repository.

## Project Overview

A client-side PGP encryption/decryption web tool. All cryptographic operations run entirely in the browser using OpenPGP.js - no data is ever sent to a server.

## Commands

### Development
```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Type-check with tsc, then build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

### Testing
```bash
npm run test                # Run unit tests in watch mode
npm run test -- --run       # Run tests once (no watch)
npm run test -- useEncrypt  # Run specific test file
npm run test:ui             # Visual test UI
npm run test:coverage       # Generate coverage report

npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:ui         # E2E tests with Playwright UI
npm run test:e2e:headed     # E2E tests in headed browser
```

### Git Workflows
```bash
npm run feature --name=description  # Create feature/description branch
npm run fix --name=description      # Create fix/description branch
npm run pr                           # Create pull request
npm run clean-branches               # Remove merged branches
```

## Architecture

### Tech Stack
- React 18 + TypeScript + Vite
- OpenPGP.js v6 for cryptography
- Tailwind CSS for styling
- Vitest + React Testing Library for unit tests
- Playwright for E2E tests

### Code Structure

**Hooks** (`src/hooks/`) - Business logic separated from UI:
- `useEncrypt` - Multi-recipient encryption with encrypt-to-self support
- `useDecrypt` - Decryption with passphrase handling
- `useSign` / `useVerify` - Clear-signed and detached signatures
- `useInspect` - Detailed key information display
- `useClipboard` - Clipboard operations with fallback support
- `useDropZone` - Drag-and-drop file handling

**Utils** (`src/utils/`):
- `pgp.ts` - OpenPGP.js wrapper (key parsing, encrypt/decrypt/sign/verify functions)
- `validation.ts` - Input validation for keys and messages (format checks, size limits)
- `sanitize.ts` - Memory clearing utilities for sensitive data

**Components** (`src/components/`):
- `EncryptForm` / `DecryptForm` / `SignForm` / `VerifyForm` - Main form containers
- `KeyInput` - Reusable key textarea with file upload and validation display
- `MessageInput` - Message textarea with optional file upload
- `OutputDisplay` - Read-only output with copy/download actions
- `KeyInspector` - Detailed key information viewer

### Data Flow
1. User input → validation (`validation.ts`) → state update (hooks)
2. On submit → OpenPGP.js operations (`pgp.ts`) → result displayed
3. No data persisted - cleared on unmount via cleanup functions

### Testing Infrastructure

**Test Helpers** (`src/test/helpers/`):
- `mockOpenpgp.ts` - Complete OpenPGP.js mocking to avoid actual crypto operations
- `mockFileReader.ts` - FileReader API mocks for file upload tests
- `testUtils.ts` - Common utilities and test data

**Test Fixtures** (`src/test/fixtures/`):
- `keys.ts` - Pre-generated test keys (Alice, Bob, Charlie, RSA) with known fingerprints
- Includes encrypted/unencrypted keys and sample messages

**Key Testing Patterns:**
- All OpenPGP.js functions are mocked via `vi.mock('openpgp')` in test files
- Use `setupDefaultMocks()` and `resetMocks()` from mockOpenpgp.ts for consistent test setup
- Use `act()` and `waitFor()` from React Testing Library for async hook operations
- Tests achieve 90%+ coverage on critical encryption/decryption paths

## Security Constraints

- CSP configured in `index.html` and `vercel.json` blocks external connections
- No localStorage/sessionStorage for sensitive data
- Components clear state on unmount
- 1MB message size limit enforced client-side

## Development Workflow

### Commit Guidelines
- **Commit Frequency**: After every moderate, logical change
- **What constitutes a moderate change**:
  - Completing a single component or utility function
  - Fixing a bug with tests
  - Adding a new hook with implementation
  - Updating documentation for a feature
  - Refactoring a specific module
  - Adding/updating tests for existing code

### Branch Strategy
- **Feature Work**: Always create feature branches
  - Branch naming: `feature/description` (e.g., `feature/add-qr-export`)
  - Bug fixes: `fix/description` (e.g., `fix/validation-edge-case`)
  - Enhancements: `enhance/description` (e.g., `enhance/button-animations`)
- **Main Branch**: Protected, only merge via PRs

### Commit Message Style
Follow conventional commits format:
- `feat: add feature description`
- `fix: fix bug description`
- `refactor: refactor description`
- `docs: documentation changes`
- `test: test additions/updates`
- `style: styling changes`

### Pull Request Guidelines
When a feature is complete:
1. Create PR with clear, descriptive title
2. PR description should include:
   - What changed and why
   - Manual test results if relevant
   - Type of change (bug fix, feature, enhancement, etc.)
   - Checklist items (tests pass, docs updated, etc.)

### Commit Cadence
- **Small Changes** (< 20 lines): Can batch 2-3 together
- **Moderate Changes** (20-100 lines): Commit immediately
- **Large Changes** (100+ lines): Break into smaller commits

### Branch Lifecycle
1. Create branch for feature/fix
2. Make commits as you work (multiple commits fine)
3. Push and create PR when done
4. After merge, delete branch
5. Return to main, pull latest
