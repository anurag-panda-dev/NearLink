# NearLink — Serverless Offline BLE & Mesh Messenger

NearLink is a decentralized, internet-free offline messenger built with React Native, Expo SDK 54, and TypeScript. It enables nearby users to discover each other, verify identities, exchange encrypted direct messages, form decentralized group rooms, and relay messages over a multi-hop Bluetooth Low Energy (BLE) mesh network without any cellular connection, SIM card, account, or central servers.

---

## Key Capabilities

1. **Zero Cloud, Serverless & Offline First**
   - No phone numbers, email addresses, accounts, or cloud infrastructure.
   - All profile identities, keys, contact rosters, groups, and message histories live strictly on-device.

2. **Cryptographic Engine (E2EE)**
   - **Identity Key Pairs:** Ed25519 signing keys & X25519 Diffie-Hellman encryption keys via TweetNaCl.
   - **One-to-One Messaging:** Authenticated end-to-end encryption using XSalsa20-Poly1305.
   - **Decentralized Groups:** 256-bit symmetric encryption keys with cryptographic epoch increments and key rotation.
   - **Safety Numbers:** Lexicographically derived 6-digit verification codes for peer-to-peer visual comparison or QR verification.

3. **BLE Abstraction & Dual-Mode Radio**
   - Dynamic BLE layer supporting native BLE (`react-native-ble-plx`) and a deterministic in-memory `BleSimulator` for automated testing and browser simulation.
   - Handshake authentication with protocol version negotiation and Ed25519 signature validation.

4. **Reliable Message Queuing & Delivery ACKs**
   - Application-level delivery acknowledgements (`MSG_ACK`). A message is marked `delivered` only upon recipient acknowledgement, not just radio transmission.
   - Persistent offline retry queue with exponential backoff.
   - Automatic queue flushing when disconnected peers come back into radio proximity.
   - Deduplication tracking to prevent duplicate message display.

5. **Multi-Hop BLE Mesh Relay Protocol**
   - **Mesh Packet Envelope:** `messageId`, `senderId`, `destinationId`, `groupId`, `sequenceNumber`, `hopLimit` (TTL max 5), `hopCount`, `expiry`, and Ed25519 digital signature.
   - **Loop Prevention:** Tracks node traversal paths in envelope headers to reject looping packets.
   - **Duplicate Suppression:** LRU & TTL bounded deduplication cache.
   - **Battery-Aware Relaying:** Option to throttle packet forwarding when battery is low.
   - **Diagnostics & Network Map:** Visual network topology diagram with real-time packet counters and dynamic routing tables.

---

## Screen Breakdown

- **Onboarding (`app/index.tsx`)**: Welcome, privacy promises, display name configuration, local keypair generation, permissions explanation.
- **Nearby Scanner (`app/nearby.tsx`)**: Live BLE scanning, peer cards with RSSI signal indicators, GATT pairing controls.
- **Chats List (`app/chats.tsx`)**: Searchable list of recent conversations, unread badges, delivery status ticks, peer online indicators.
- **Direct Chat (`app/chat/[id].tsx`)**: E2EE messaging, delivery indicators (`queued` -> `sending` -> `sent` -> `delivered`), safety number modal, emoji reactions.
- **Mesh Groups (`app/groups.tsx`)**: Group rooms list, member counters, unread preview badges.
- **Create Group (`app/group/create.tsx`)**: Form to create an offline room with automatic 256-bit symmetric key generation.
- **Group Chat (`app/group/[id].tsx`)**: Multi-recipient mesh chat, sender identification, member roster modal, QR invite generator, key rotation.
- **Mesh Topology & Diagnostics (`app/mesh.tsx`)**: Interactive radar map of local and relayed nodes, live routing table, test packet transmission, battery saver toggle.
- **Settings & Privacy (`app/settings.tsx`)**: Display name editing, public key fingerprints, QR identity sharing, discoverable mode switch, relay opt-in switch, cryptographic diagnostics, and irreversible data wipe.

---

## Verification & Test Suite

Run the Gravitas verification suite:

```bash
npm test
```

Run TypeScript strict type checking:

```bash
npm run typecheck
```
