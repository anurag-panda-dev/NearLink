# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Reporting a Vulnerability

We take the security and cryptographic integrity of NearLink seriously. If you believe you have discovered a vulnerability related to encryption, key derivation, BLE packet framing, or packet spoofing:

1. **Do not create a public GitHub issue.**
2. Send an email to `anurag-panda-dev@gmail.com` (or file a confidential security advisory on GitHub).
3. Include:
   - Detailed description of the potential vulnerability
   - Steps to reproduce or proof-of-concept payload
   - Impact assessment
4. We will acknowledge receipt within 48 hours and work on a verified resolution.

---

## Cryptographic Invariants

NearLink relies on standard, reviewed cryptographic primitives:
- **X25519** for Diffie-Hellman key exchange.
- **Ed25519** for digital message signatures and peer identity authentication.
- **XSalsa20-Poly1305** for authenticated symmetric encryption of one-to-one messages.
- **Secretbox (256-bit)** for group room encryption.
- **Zero Cloud Storage**: Keys never leave the local platform device.
