<!--
  ┌──────────────────────────────────────────────────────────────┐
  │  NearLink — Serverless Offline BLE & Mesh Messenger           │
  │  Tip: the slug `anurag-panda-dev/NearLink` is used in every  │
  │  badge & link below. Search & replace it if your repo path   │
  │  differs.                                                     │
  └──────────────────────────────────────────────────────────────┘
-->

<div align="center">

<p align="center">
  <img src="./assets/icon.png" alt="NearLink logo" width="128" height="128" />
</p>

# 📡 NearLink

### Serverless · Offline-First · End-to-End Encrypted · BLE Mesh

<p align="center">
  <img alt="NearLink typing" src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&center=true&width=620&lines=No+cloud.+No+account.+No+signal.&color=00F0FF&vCenter=true&repeat=true&fadeIn=false" />
</p>

<p align="center">
  <strong>NearLink</strong> is a decentralized offline messenger built with
  <strong>React Native</strong> &amp; <strong>Expo</strong>. Nearby phones discover each other over
  <strong>Bluetooth Low Energy</strong>, verify identities with <strong>Ed25519</strong> signatures, and
  exchange <strong>end-to-end encrypted</strong> messages — relayed across a
  <strong>multi-hop BLE mesh</strong> with no cellular signal, no SIM, no server, no internet.
</p>

<p align="center">
  <a href="#-quick-start"><img alt="Quick Start" src="https://img.shields.io/badge/Quick_Start-080C15?style=for-the-badge&logo=rocket&logoColor=00F0FF" height="38" /></a>
  <a href="#-architecture"><img alt="Architecture" src="https://img.shields.io/badge/Architecture-080C15?style=for-the-badge&logo=blueprint&logoColor=8B5CF6" height="38" /></a>
  <a href="#-the-mesh-protocol"><img alt="Mesh" src="https://img.shields.io/badge/Mesh_Protocol-080C15?style=for-the-badge&logo=bluetooth&logoColor=10B981" height="38" /></a>
  <a href="#-cryptography"><img alt="Crypto" src="https://img.shields.io/badge/%F0%9F%9B%A1%EF%B8%8F%20E2EE_Encrypted-080C15?style=for-the-badge" height="38" /></a>
</p>

</div>

---

## 🏅 Badges

<div align="center">

[![React Native](https://img.shields.io/badge/React_Native-0.86.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Expo Router](https://img.shields.io/badge/Expo_Router-File_Based-EC4899?style=for-the-badge&logo=reactrouter&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](./LICENSE)
[![Tests](https://img.shields.io/badge/Tests-22%20tests%20%2F%205%20suites-10B981?style=for-the-badge&logo=jest&logoColor=white)](https://github.com/anurag-panda-dev/NearLink/actions/workflows/ci.yml)

[![CI](https://img.shields.io/github/actions/workflow/status/anurag-panda-dev/NearLink/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/anurag-panda-dev/NearLink/actions/workflows/ci.yml)
[![Typecheck](https://img.shields.io/badge/Typecheck-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/anurag-panda-dev/NearLink/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/anurag-panda-dev/NearLink?style=for-the-badge&logo=github&logoColor=white&color=00F0FF)](https://github.com/anurag-panda-dev/NearLink/stargazers)
[![Forks](https://img.shields.io/github/forks/anurag-panda-dev/NearLink?style=for-the-badge&logo=github&logoColor=white&color=8B5CF6)](https://github.com/anurag-panda-dev/NearLink/network/members)
[![Issues](https://img.shields.io/github/issues/anurag-panda-dev/NearLink?style=for-the-badge&logo=github&logoColor=white&color=F59E0B)](https://github.com/anurag-panda-dev/NearLink/issues)
[![PRs](https://img.shields.io/github/issues-pr/anurag-panda-dev/NearLink?style=for-the-badge&logo=github&logoColor=white&color=10B981)](https://github.com/anurag-panda-dev/NearLink/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/anurag-panda-dev/NearLink?style=for-the-badge&logo=git&logoColor=white)](https://github.com/anurag-panda-dev/NearLink/commits/main)
[![Contributors](https://img.shields.io/github/contributors/anurag-panda-dev/NearLink?style=for-the-badge&logo=github&logoColor=white)](https://github.com/anurag-panda-dev/NearLink/graphs/contributors)

[![No Cloud](https://img.shields.io/badge/%E2%98%81%EF%B8%8F%20Zero_Cloud-080C15?style=for-the-badge)](https://github.com/anurag-panda-dev/NearLink)
[![Offline First](https://img.shields.io/badge/%E2%9C%88%EF%B8%8F%20Offline_First-080C15?style=for-the-badge)](https://github.com/anurag-panda-dev/NearLink)
[![BLE Mesh](https://img.shields.io/badge/%F0%9F%93%B6%20BLE_Mesh-080C15?style=for-the-badge)](https://github.com/anurag-panda-dev/NearLink)
[![Contributions Welcome](https://img.shields.io/badge/%E2%9C%A9%20Contributions_Welcome-FF69B4?style=for-the-badge)](./CONTRIBUTING.md)
[![Made with Love](https://img.shields.io/badge/Made_with_%E2%9D%A4%20in_Offline_Chambers-FF69B4?style=for-the-badge)](https://github.com/anurag-panda-dev/NearLink)

</div>

---

## 📑 Table of Contents

<details>
<summary><b>Click to expand</b></summary>

- [💡 Why NearLink](#-why-nearlink)
- [🚀 Quick Start](#-quick-start)
- [✨ Feature Matrix](#-feature-matrix)
- [🧬 Architecture](#-architecture)
- [🌐 The Mesh Protocol](#-the-mesh-protocol)
- [🔐 Cryptography](#-cryptography)
- [📬 Reliable Delivery](#-reliable-delivery)
- [📱 App Tour](#-app-tour)
- [🧪 Testing & CI](#-testing--ci)
- [📂 Project Structure](#-project-structure)
- [🧰 Tech Stack](#-tech-stack)
- [🧭 Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [🔒 Security](#-security)
- [📄 License](#-license)

</details>

---

## 💡 Why NearLink

When the network dies — disaster zone, blackout, concert, campus outage, border crossing, mountain trail — normal messengers go silent. **NearLink keeps talking.**

It turns every phone into a **mesh node**. Devices form an ad-hoc BLE network, and messages hop device-to-device until they reach their destination — even when no two peers are in direct radio range.

| | **NearLink** | WhatsApp | Telegram | Signal |
|---|:---:|:---:|:---:|:---:|
| Works with **zero internet** | ✅ | ❌ | ❌ | ❌ |
| **No central server** | ✅ | ❌ | ❌ | ⚠️ |
| **No account / phone number** | ✅ | ❌ | ❌ | ❌ |
| **End-to-end encrypted** | ✅ | ✅ | ✅ | ✅ |
| **Multi-hop mesh relay** | ✅ | ❌ | ❌ | ❌ |
| **Device-to-device only** | ✅ | ❌ | ❌ | ❌ |
| **Open source** | ✅ MIT | ❌ | ❌ | ✅ |
| **Works in airplane mode** | ✅ | ❌ | ❌ | ❌ |

> **Zero Cloud Invariant** — NearLink contains no analytics SDK, no remote backend, no telemetry, no account system. Every key, contact, group, and message lives only on your device.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | v18+ (v20 recommended) |
| **Package Manager** | npm / yarn |
| **Device** | Android 8+ / iOS 13+ with Bluetooth LE |
| **Optional** | Expo Go (UI preview) · Android Studio / Xcode (native BLE builds) |

### 1️⃣ Install

```bash
git clone https://github.com/anurag-panda-dev/NearLink.git
cd NearLink
npm install --legacy-peer-deps
```

### 2️⃣ Run

```bash
npm start          # Expo dev server (press w = web, a = android, i = ios)
npm run android    # native Android build
npm run ios        # native iOS build
npm run web        # browser preview via BLE simulator
```

### 3️⃣ Verify

```bash
npm test           # 22 unit tests across 5 suites
npm run typecheck  # strict TypeScript check
```

### 4️⃣ Build a distributable APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview    # → downloadable .apk + QR code
```

> 📖 Full walkthrough — device setup, local Gradle builds, multi-device BLE testing and mesh relay testing — lives in **[GUIDE.md](./GUIDE.md)**.

---

## ✨ Feature Matrix

<div align="center">

| 🔒 **Cryptography** | 📶 **Radio & Mesh** | 📨 **Messaging** |
|:---:|:---:|:---:|
| Ed25519 identity signatures | Dual-mode radio abstraction | End-to-end encrypted DMs |
| X25519 key agreement | Live BLE peer discovery | Decentralized group rooms |
| XSalsa20-Poly1305 AEAD | Signed handshake + version negotiation | 256-bit group keys w/ epochs |
| Safety numbers (6-digit) | Multi-hop relay (TTL = 5) | Application-level delivery ACKs |
| SHA-512 fingerprints | Loop prevention via path vector | Persistent offline retry queue |
| Key rotation on membership change | LRU + TTL dedup cache | Auto-flush on reconnect |
| QR identity & invite codes | Battery-aware relay throttling | Duplicate suppression |

</div>

### 🚫 Zero Cloud, Serverless & Offline First
- No phone numbers, no email, no accounts, no cloud infrastructure.
- Profiles, keypairs, contact rosters, groups and message history live **strictly on-device**.
- Every byte travels radio-to-radio — no DNS, no TLS termination, no middlebox.

### 🧬 Cryptographic Engine (E2EE)
- **Identity keypairs** — Ed25519 signing + X25519 Diffie–Hellman, generated via TweetNaCl.
- **One-to-one messaging** — authenticated public-key encryption (`nacl.box`).
- **Decentralized groups** — 256-bit symmetric keys with epoch increments and rotation.
- **Safety numbers** — lexicographically derived 6-digit codes for out-of-band verification.
- **Mesh envelopes** — every forwarded packet is Ed25519-signed.

### 📶 BLE Abstraction & Dual-Mode Radio
- Pluggable `BleManagerInterface` driver — ships with a deterministic in-memory **`BleSimulator`** for tests, CI and browser preview.
- Native drivers (`react-native-ble-plx`, `expo-bluetooth`) drop in via `BleService.setManager()` — no call-site changes.
- Signed handshake with protocol version negotiation and signature validation on every peer.

### 📨 Reliable Message Queuing & Delivery ACKs
- Messages are marked `delivered` **only on recipient acknowledgement** — never on radio transmission.
- Persistent offline queue with exponential backoff, 5-attempt ceiling, and auto-flush when peers return.
- Deterministic duplicate suppression across queue, chat store and mesh layers.

### 🔗 Multi-Hop BLE Mesh Relay
- Signed **mesh packet envelope**: `messageId`, `senderId`, `destinationId`, `groupId`, `sequenceNumber`, `hopLimit`, `hopCount`, `expiry`, `signature`, `path`.
- **Loop prevention** — path vector tracking rejects packets that revisit a node.
- **Duplicate suppression** — LRU + TTL-bounded dedup cache (2 000 entries / 1 h).
- **Battery-aware relaying** — forwarding throttled automatically when the battery is low.
- **Live diagnostics** — interactive topology map, routing tables, and packet counters.

---

## 🧬 Architecture

```mermaid
graph TB
    subgraph UI["🎨 Presentation — Expo Router"]
        ONB["Onboarding<br/>app/index.tsx"]
        NEAR["Nearby Scanner<br/>app/nearby.tsx"]
        CHAT["Chats & Direct Chat<br/>app/chats.tsx"]
        GRP["Groups<br/>app/groups.tsx"]
        MESH["Mesh Map<br/>app/mesh.tsx"]
        SET["Settings<br/>app/settings.tsx"]
    end

    subgraph STATE["🧠 State — Zustand"]
        IS["identityStore"]
        BS["bleStore"]
        CS["chatStore"]
        GS["groupStore"]
        MS["meshStore"]
    end

    subgraph CORE["⚙️ Core Services"]
        Q["QueueManager<br/>framing • retries • ACKs"]
        GM["GroupManager<br/>epochs • rotation"]
        MR["MeshRouter<br/>TTL • flooding • routes"]
        BSVC["BleService<br/>handshake • driver swap"]
    end

    subgraph RADIO["📶 Radio Layer"]
        SIM["BleSimulator<br/>deterministic test radio"]
        NAT["Native BLE Driver<br/>react-native-ble-plx"]
    end

    subgraph SEC["🔐 Security Layer"]
        K["keys.ts<br/>Ed25519 • fingerprints • safety no."]
        C["cipher.ts<br/>box • secretbox"]
    end

    STORE[("💾 LocalStorage<br/>profile • keys • msgs • groups")]

    UI --> STATE --> CORE
    BSVC --> RADIO
    Q --> BSVC
    MR --> BSVC
    GM --> MR
    CORE --> SEC
    CORE --> STORE

    style UI fill:#111726,stroke:#00F0FF,color:#F8FAFC
    style STATE fill:#111726,stroke:#8B5CF6,color:#F8FAFC
    style CORE fill:#172033,stroke:#00F0FF,color:#F8FAFC
    style RADIO fill:#172033,stroke:#10B981,color:#F8FAFC
    style SEC fill:#172033,stroke:#EF4444,color:#F8FAFC
    style STORE fill:#172033,stroke:#F59E0B,color:#F8FAFC
```

### Layer by Layer

| Layer | Module | Responsibility |
|---|---|---|
| 🎨 **Presentation** | `app/` | Expo Router screens, dark cyberpunk theme, `lucide-react-native` icons |
| 🧠 **State** | `src/stores/` | Zustand slices for identity, BLE, chat, groups, mesh |
| ⚙️ **Core** | `src/services/` | Queueing, group management, mesh routing, BLE orchestration |
| 📶 **Radio** | `src/services/ble/` | Driver interface, simulator, native driver seam |
| 🔐 **Security** | `src/services/crypto/` | Key generation, AEAD encryption, signing, QR payloads |
| 💾 **Storage** | `src/services/storage/` | On-device persistence boundary (`StorageInterface`) |

---

## 🔗 The Mesh Protocol

### Packet envelope

```ts
interface MeshPacketEnvelope {
  messageId: string;      // unique dedup id
  senderId: string;
  senderName: string;
  destinationId: string;  // peer id | group id | '*' for broadcast
  groupId?: string;
  sequenceNumber: number;
  hopLimit: number;       // TTL, starts at 5
  hopCount: number;       // increments per hop
  expiry: number;         // unix ms — packets expire after 24 h
  payload: string;        // encrypted JSON
  signature: string;      // Ed25519 over id+destination+payload+seq
  path: string[];         // node ids that forwarded this packet
}
```

### Relay sequence

```mermaid
sequenceDiagram
    autonumber
    participant A as 📱 Alice
    participant B as 🔗 Bob (relay)
    participant C as 📱 Cara

    A->>B: MESH_FORWARD (hopLimit 5, hopCount 0)
    Note over B: TTL ok • not duplicate<br/>node not in path → forward
    B->>C: MESH_FORWARD (hopLimit 4, hopCount 1)
    Note over C: destinationId == C<br/>→ decrypt + deliver locally
    C-->>B: MSG_ACK
    B-->>A: MSG_ACK
    Note over A: status: sent → delivered ✅
```

### Flooding rules

| Guard | Rule | Behaviour |
|---|---|---|
| ⏱️ **TTL** | `hopLimit ≤ 1` | Packet dropped, counted as `totalPacketsDroppedTtl` |
| 🔁 **Loop prevention** | `path.includes(localNodeId)` | Packet dropped — never re-broadcast |
| 🧬 **Duplicate suppression** | LRU 2 000 entries / 1 h TTL | Second copy dropped + counted |
| 🪫 **Battery-aware relay** | `batteryLow === true` | Node stops forwarding (still receives) |
| 📦 **Size guard** | `payload > 64 KB` | Oversized packet dropped |
| ⌛ **Expiry** | `now > expiry` | Stale packet dropped |

---

## 🔐 Cryptography

Built on **[TweetNaCl](https://tweetnacl.js.org/)** — a minimal, audited pure-JS port of NaCl.

| Purpose | Primitive | Implementation |
|---|---|---|
| Identity signing | **Ed25519** | `nacl.sign.keyPair()` · `nacl.sign.detached` |
| Key agreement | **X25519** | `nacl.box.keyPair()` |
| 1:1 message encryption | **XSalsa20-Poly1305** (AEAD) | `nacl.box` / `nacl.box.open` |
| Group message encryption | **XSalsa20-Poly1305** + 256-bit key | `nacl.secretbox` / `nacl.secretbox.open` |
| Fingerprints | **SHA-512** (truncated) | `nacl.hash` → `A1:B2:C3:…` |
| Safety numbers | **SHA-512** → 6 digits | lexicographically sorted key pair |
| Nonces | 24-byte CSPRNG | `nacl.randomBytes` per message |
| QR payloads | `nearlink:` URI + Base64 | `src/services/crypto/qr.ts` |

### Key hierarchy

```mermaid
flowchart LR
    A["🖥️ Device Root"] --> B["Ed25519 Identity Key<br/>sign handshakes & mesh envelopes"]
    A --> C["X25519 Encryption Key<br/>key agreement with peers"]
    A --> D["🔐 Group Key v_n<br/>256-bit symmetric • epoch n"]
    C --> E["🔒 XSalsa20-Poly1305<br/>1:1 sealed message"]
    D --> F["🔒 XSalsa20-Poly1305<br/>group broadcast"]
    E --> G["✅ Safety Number<br/>6-digit verification"]
    style A fill:#172033,stroke:#00F0FF,color:#F8FAFC
    style B fill:#111726,stroke:#8B5CF6,color:#F8FAFC
    style C fill:#111726,stroke:#8B5CF6,color:#F8FAFC
    style D fill:#111726,stroke:#F59E0B,color:#F8FAFC
    style E fill:#111726,stroke:#10B981,color:#F8FAFC
    style F fill:#111726,stroke:#10B981,color:#F8FAFC
    style G fill:#111726,stroke:#EF4444,color:#F8FAFC
```

---

## 📬 Reliable Delivery

```mermaid
stateDiagram-v2
    [*] --> queued: message composed
    queued --> sending: radio attempt
    sending --> sent: packet transmitted
    sent --> delivered: MSG_ACK received ✅
    sending --> queued: retry (backoff)
    queued --> failed: 5 attempts exhausted ❌
    failed --> queued: peer back in range → flush
    delivered --> [*]
```

- **ACK-based, not TX-based.** A blue tick means *the radio sent it*. A double tick means *the recipient confirmed it*.
- **Persistent queue.** Undelivered packets survive app restarts and are retried every 3 s (4 s since last attempt).
- **Auto-flush.** When a peer re-enters radio proximity, the queue for that peer is drained instantly.
- **Duplicate suppression.** `processedMessageIds` guarantees a message renders exactly once.

---

## 📱 App Tour

| Screen | Route | Highlights |
|---|---|---|
| 🧑 **Onboarding** | `app/index.tsx` | Privacy promises, display name, on-device keypair generation, permission rationale |
| 📡 **Nearby Scanner** | `app/nearby.tsx` | Live BLE scan, peer cards with live RSSI bars, GATT pairing |
| 💬 **Chats** | `app/chats.tsx` | Searchable conversation list, unread badges, delivery ticks, online indicators |
| 🗨️ **Direct Chat** | `app/chat/[id].tsx` | E2EE messaging, safety-number modal, reactions, status timeline |
| 👥 **Groups** | `app/groups.tsx` | Room list, member counters, unread previews |
| ➕ **Create Group** | `app/group/create.tsx` | Offline room creation with auto-generated 256-bit key |
| 🕸️ **Group Chat** | `app/group/[id].tsx` | Multi-recipient mesh chat, member roster, QR invites, key rotation |
| 🗺️ **Mesh Topology** | `app/mesh.tsx` | Interactive radar map, live routing table, test packets, battery saver |
| ⚙️ **Settings** | `app/settings.tsx` | Identity, key fingerprints, QR sharing, discoverable/relay toggles, data wipe |

### 🎨 Design language

Dark cyberpunk palette defined in `src/theme/colors.ts`:

```ts
background:     '#080C15'   // near-black base
surface:        '#111726'
primary:        '#00F0FF'   // cyberpunk BLE cyan
success:        '#10B981'   // verified / delivered emerald
purple:         '#8B5CF6'   // mesh relay violet
```

---

## 🧪 Testing & CI

```bash
npm test              # Jest + ts-jest — 22 tests, 5 suites
npm run test:coverage # coverage report
npm run typecheck     # tsc --noEmit (strict)
```

| Suite | Covers | Tests |
|---|---|:---:|
| 🔐 `crypto.test.ts` | Keypairs, fingerprints, safety numbers, signing, AEAD, group keys, QR | 7 |
| 🕸️ `mesh-routing.test.ts` | Envelope origination, loop prevention, TTL drop, dedup, battery policy | 5 |
| 👥 `group-messaging.test.ts` | Group creation, roster, encrypted send, key rotation + epoch | 4 |
| 📨 `message-queue.test.ts` | Envelope framing, ACK framing, duplicate suppression, delivery ACK | 4 |
| 📶 `ble-simulator.test.ts` | Peer discovery, GATT connect, packet transmission | 2 |

**CI pipeline** — `.github/workflows/ci.yml` runs typecheck + Jest on every push and PR to `main` (Node 20, npm cache enabled).

<details>
<summary><b>🧪 Example test run</b></summary>

```bash
$ npm test

PASS  tests/crypto.test.ts
PASS  tests/mesh-routing.test.ts
PASS  tests/group-messaging.test.ts
PASS  tests/message-queue.test.ts
PASS  tests/ble-simulator.test.ts

Test Suites: 5 passed, 5 total
Tests:       22 passed, 22 total
Snapshots:   0 total
```

</details>

---

## 📂 Project Structure

```
NearLink/
├── app/                        # 📱 Expo Router screens
│   ├── index.tsx               #    Onboarding
│   ├── nearby.tsx              #    BLE peer scanner
│   ├── chats.tsx               #    Conversation list
│   ├── chat/[id].tsx           #    Direct chat
│   ├── groups.tsx              #    Group list
│   ├── group/create.tsx        #    Create group
│   ├── group/[id].tsx          #    Group chat
│   ├── mesh.tsx                #    Topology & diagnostics
│   ├── settings.tsx            #    Identity & privacy
│   └── _layout.tsx             #    Root stack
│
├── src/
│   ├── components/             # 🧩 MeshTopologyMap, MessageBubble, PeerCard…
│   ├── services/
│   │   ├── ble/                # 📶 BleService, BleSimulator, driver interface
│   │   ├── crypto/             # 🔐 keys.ts, cipher.ts, qr.ts
│   │   ├── group/              # 👥 GroupManager
│   │   ├── mesh/               # 🕸️ MeshRouter, DeduplicationCache
│   │   ├── message-queue/      # 📨 QueueManager, Framing
│   │   └── storage/            # 💾 LocalStorage, StorageInterface
│   ├── stores/                 # 🧠 Zustand slices (identity/ble/chat/group/mesh)
│   ├── theme/                  # 🎨 Design tokens
│   └── types/                  # 📐 Shared TypeScript contracts
│
├── tests/                      # 🧪 Jest suites (22 tests)
├── assets/                     # 🖼️ Brand assets (icon, splash, favicon) — `npm run assets`
├── scripts/                    # 🛠️ Asset generation & validation tooling
├── .github/                    # ⚙️ CI workflow, issue + PR templates
├── app.json · eas.json         # Expo + EAS Build config
├── GUIDE.md                    # 📖 Build & device testing guide
├── CONTRIBUTING.md             # 🤝 Contribution guide
├── SECURITY.md                 # 🛡️ Disclosure policy
└── CODE_OF_CONDUCT.md          # 📜 Contributor Covenant 2.1
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| 📱 **Framework** | React Native `0.86.3` · Expo SDK `57` · React `19.2` |
| 🧭 **Navigation** | Expo Router `57` (file-based, typed routes) |
| 🔐 **Cryptography** | TweetNaCl `1.0.3` + `tweetnacl-util` |
| 🧠 **State** | Zustand `5` |
| ✅ **Validation** | Zod `3` |
| 🎨 **UI** | `lucide-react-native` · `react-native-svg` · `expo-status-bar` |
| 💾 **Storage** | `StorageInterface` boundary · `expo-secure-store` & `expo-crypto` for key material |
| 🧪 **Testing** | Jest `29` · ts-jest · GitHub Actions |
| 📦 **Build** | EAS Build (APK + App Bundle) · local Gradle |
| 📄 **License** | MIT |

---

## 🧭 Roadmap

- [x] 🔐 E2EE 1:1 messaging, decentralized groups, key rotation
- [x] 🕸️ Multi-hop BLE mesh with TTL, loop prevention & dedup
- [x] 📨 Reliable delivery queue with ACKs & offline retry
- [x] 🧪 22-test verification suite + CI
- [x] 🗺️ Live mesh topology & routing diagnostics
- [ ] 📶 Native BLE driver (`react-native-ble-plx` / `expo-bluetooth`) behind `BleManagerInterface`
- [ ] 💾 Durable on-device persistence via `expo-secure-store` + SQLite
- [ ] 📷 QR scan-to-verify with camera-based safety-number confirmation
- [ ] 🔊 Voice notes & file transfer over chunked BLE frames
- [ ] 🕸️ Zigbee / Thread / LoRa transport adapters
- [ ] 🌍 Multi-language (i18n) + RTL support
- [ ] 📲 Background BLE relay service (Android foreground service)

---

## 🤝 Contributing

Contributions are **welcome** — from developers, cryptographers, and designers.

1. 🍴 **Fork & clone** the repository
2. 🌱 **Create a branch** — `feature/mesh-packet-compression`
3. 🧪 **Verify locally** — `npm test && npm run typecheck`
4. 📝 **Commit** using [Conventional Commits](https://www.conventionalcommits.org/)
5. 🔁 **Open a Pull Request** with test evidence

**Architectural principles we don't break:**
- ☁️ **Zero Cloud** — no analytics, no remote backends, no centralized services.
- 🔐 **Audited crypto** — Ed25519, X25519, XSalsa20-Poly1305 only.
- 🧪 **Test evidence** — routing, state and crypto changes ship with tests.

📖 Read the full **[CONTRIBUTING.md](./CONTRIBUTING.md)** · 💬 Join the discussion in **[Issues](https://github.com/anurag-panda-dev/NearLink/issues)**.

---

## 🔒 Security

NearLink handles keys and messages that never leave the device — but please report vulnerabilities responsibly.

| | |
|---|---|
| 📬 **Report** | File a confidential advisory via GitHub Security Advisories, or email `security@nearlink.local` |
| ⏱️ **Response** | Initial triage within 72 hours |
| 📄 **Policy** | Full disclosure policy in **[SECURITY.md](./SECURITY.md)** |

> 🧪 The crypto layer is **not yet independently audited**. Use at your own risk and please report any issues you find.

---

## 📄 License

Released under the **MIT License**.

```
MIT © 2026 NearLink Contributors
```

See **[LICENSE](./LICENSE)** for the full text.

---

<div align="center">

### 💬 Built for the moments the internet isn't there.

<sub>Made with ❤️ by the NearLink community · <a href="https://github.com/anurag-panda-dev/NearLink/issues">Report an issue</a> · <a href="./CONTRIBUTING.md">Contribute</a></sub>

**⭐ Star this repo if you believe communication should work without a signal.**

</div>
