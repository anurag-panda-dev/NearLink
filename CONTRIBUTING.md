# Contributing to NearLink

Thank you for your interest in contributing to NearLink! We welcome contributions from developers, cryptographers, and designers worldwide to make offline, serverless communication accessible and resilient.

---

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/NearLink.git
   cd NearLink
   ```

2. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/mesh-packet-compression
   ```

4. **Verify Locally**
   Before submitting code, ensure all tests and type checks pass:
   ```bash
   npm test
   npm run typecheck
   ```

5. **Commit Conventions**
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add audio chunking transfer`
   - `fix: prevent duplicate delivery ack`
   - `docs: update apk build guide`
   - `test: add multi-hop routing tests`

6. **Submit a Pull Request**
   Open a pull request against the `main` branch with a clear description of the problem solved and test evidence.

---

## Architectural Principles

- **Zero Cloud Invariant**: Never introduce third-party cloud analytics, remote backends, or centralized server dependencies.
- **Crypto Audits**: All cryptographic functions must rely on audited algorithms (Ed25519, X25519, ChaCha20-Poly1305 / XSalsa20).
- **Test Evidence**: Any PR modifying routing, state, or cryptography must include automated unit/integration tests.
