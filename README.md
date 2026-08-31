# Wood Costing ERP

## 🔒 Security & Secrets Management

This project strictly follows the 12-Factor App methodology for configuration. **No secrets or credentials should ever be hardcoded into the source code.**

### Environment Variables
All configuration and secrets are loaded from environment variables.
- Copy `.env.example` to `.env` (this file is git-ignored).
- Fill in your actual credentials.
- Note: Variables prefixed with `VITE_` are exposed to the browser. Never prefix sensitive secrets (e.g. Stripe Secret Key, database passwords) with `VITE_`.

### ⚠️ Git History Warning
If you previously had any hardcoded secrets (API keys, database URLs, tokens, etc.) committed to this repository, **removing them from the current code is not enough.** Those secrets still exist in your Git history. 

**You MUST rotate any previously hardcoded secrets immediately.** Treat them as compromised.

## Quick Start
1. Run `npm install`
2. Run `npm run dev` to start the development server
