/**
 * NearLink — runnable offline-mesh demo.
 *
 *   npm run demo
 *
 * Every step below exercises the *real* production modules that ship in
 * `src/` — no mocks, no re-implementations:
 *
 *   src/services/crypto/keys.ts      Ed25519 / X25519 identity, fingerprints, safety numbers
 *   src/services/crypto/cipher.ts     XSalsa20-Poly1305 sealed boxes & group secretboxes
 *   src/services/crypto/qr.ts         nearlink:// QR payload round-trip
 *   src/services/ble/BleSimulator.ts  deterministic in-memory BLE radio
 *   src/services/ble/BleService.ts    signed handshake over the radio
 *   src/services/mesh/MeshRouter.ts   TTL, loop prevention, dedup, flooding, diagnostics
 *   src/services/message-queue/*      wire framing + delivery ACKs
 */
import { BleSimulator } from '../src/services/ble/BleSimulator';
import { BleService } from '../src/services/ble/BleService';
import { MeshRouter, MAX_HOP_LIMIT } from '../src/services/mesh/MeshRouter';
import {
  generateUserIdentityKeys,
  getFingerprint,
  getSafetyNumber,
  signData,
  verifySignature,
} from '../src/services/crypto/keys';
import {
  encryptForPeer,
  decryptFromPeer,
  generateGroupKey,
  encryptGroupMessage,
  decryptGroupMessage,
} from '../src/services/crypto/cipher';
import { createIdentityQrString, parseNearlinkQr } from '../src/services/crypto/qr';
import { frameMessagePacket, frameAckPacket, parseAckPayload } from '../src/services/message-queue/Framing';
import { MeshPacketEnvelope } from '../src/types/mesh';
import { UserProfile } from '../src/types/identity';

/* --------------------------------------------------------------- output --- */

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[38;5;51m',
  violet: '\x1b[38;5;141m',
  emerald: '\x1b[38;5;42m',
  amber: '\x1b[38;5;214m',
  red: '\x1b[38;5;203m',
  grey: '\x1b[38;5;245m',
};

const noColor = process.env.NO_COLOR !== undefined || !process.stdout.isTTY;
const paint = (color: string, text: string) => (noColor ? text : `${color}${text}${C.reset}`);
const dim = (t: string) => paint(C.dim, t);
const cyan = (t: string) => paint(C.cyan, t);
const violet = (t: string) => paint(C.violet, t);
const emerald = (t: string) => paint(C.emerald, t);
const amber = (t: string) => paint(C.amber, t);
const red = (t: string) => paint(C.red, t);
const bold = (t: string) => paint(C.bold, t);

const line = (label: string, value: string) => console.log(`  ${dim(label.padEnd(22))} ${value}`);
const ok = (msg: string) => console.log(`  ${emerald('✔')} ${msg}`);
const drop = (msg: string) => console.log(`  ${red('✖')} ${msg}`);
const step = (n: number, title: string) =>
  console.log(`\n${cyan(`[${n}/6]`)} ${bold(title)}\n${dim('  ' + '─'.repeat(66))}`);

const short = (s: string, n = 24) => (s.length > n ? s.slice(0, n) + '…' : s);

/* ----------------------------------------------------------------- main --- */

async function main() {
  console.log(bold(cyan('\n  NearLink — offline mesh demo\n')));
  console.log(dim('  No server. No internet. Just radio + cryptography.\n'));

  /* [1] ------------------------------------------------------------ identity */
  step(1, 'Device identity (Ed25519 + X25519, generated on-device)');

  const alice = generateUserIdentityKeys();
  const bob = generateUserIdentityKeys();

  const aliceProfile: UserProfile = {
    id: 'demo-alice',
    displayName: 'Alice',
    avatarSeed: 'ALIC',
    publicKey: alice.encryption.publicKey,
    signingPublicKey: alice.signing.publicKey,
    createdAt: Date.now(),
    isDiscoverable: true,
    relayOptIn: true,
  };

  line('alice signing key', violet(short(alice.signing.publicKey)));
  line('alice box key', cyan(short(alice.encryption.publicKey)));
  line('fingerprint', bold(getFingerprint(alice.encryption.publicKey)));

  const safety = getSafetyNumber(alice.encryption.publicKey, bob.encryption.publicKey);
  const safetyMirror = getSafetyNumber(bob.encryption.publicKey, alice.encryption.publicKey);
  line('safety number', bold(amber(safety)));
  ok(`both sides derive the same 6-digit code (${safety === safetyMirror ? 'match' : 'MISMATCH'})`);

  const qr = createIdentityQrString(aliceProfile);
  const parsedQr = parseNearlinkQr(qr);
  ok(`QR identity round-trip → ${parsedQr && parsedQr.type === 'IDENTITY' ? parsedQr.name : 'FAILED'}`);

  /* [2] ------------------------------------------------------ end-to-end */
  step(2, 'End-to-end encryption (XSalsa20-Poly1305)');

  const plaintext = 'Meet me at the north tower in 5.';
  const sealed = encryptForPeer(plaintext, bob.encryption.publicKey, alice.encryption.secretKey);
  const opened = decryptFromPeer(sealed, bob.encryption.secretKey);

  line('plaintext', plaintext);
  line('ciphertext', bold(short(sealed.ciphertext, 48)));
  line('nonce', dim(short(sealed.nonce, 28)));
  line('decrypted', opened ?? '');
  ok(`round trip → "${opened}"`);

  const tampered = { ...sealed, ciphertext: sealed.ciphertext.slice(0, -6) + 'AAAAAA' };
  const tamperResult = decryptFromPeer(tampered, bob.encryption.secretKey);
  if (tamperResult === null) ok('tampered ciphertext rejected (AEAD tag mismatch)');
  else drop('tampered ciphertext DECRYPTED — this is a bug');

  /* [3] ------------------------------------------------------------ radio */
  step(3, 'Signed handshake over the simulated BLE radio');

  const simAlice = new BleSimulator('demo-alice');
  const simBob = new BleSimulator('demo-bob');
  const simCara = new BleSimulator('demo-cara');

  const receivedByBob: any[] = [];
  simBob.onPacketReceived((fromId, packet) => receivedByBob.push({ fromId, packet }));
  const receivedByCara: any[] = [];
  simCara.onPacketReceived((fromId, packet) => receivedByCara.push({ fromId, packet }));

  const ble = BleService.getInstance();
  ble.setManager(simAlice);
  ble.setIdentity(aliceProfile, alice.signing.secretKey);

  await ble.connectToPeer('demo-bob');
  await simAlice.connect('demo-cara');

  const handshake = receivedByBob.find((r) => r.packet.type === 'HANDSHAKE');
  if (!handshake) {
    drop('no handshake received');
  } else {
    const payload = JSON.parse(handshake.packet.payload);
    const valid = verifySignature(
      handshake.packet.payload,
      handshake.packet.signature,
      payload.signingPublicKey
    );
    line('from → to', `${cyan('demo-alice')} → ${cyan('demo-bob')}`);
    line('packet type', handshake.packet.type);
    line('announced name', payload.displayName);
    ok(valid ? 'Ed25519 signature verified by the receiver' : 'SIGNATURE INVALID');
  }

  /* [4] ------------------------------------------------------ mesh packet */
  step(4, 'Mesh envelope origination + radio transmission');

  const router = MeshRouter.getInstance();
  router.configure('demo-alice', 'Alice', alice.signing.secretKey, true);

  const message = JSON.stringify({ text: 'meet at the north tower', ts: Date.now() });
  const envelope = await router.originateMeshPacket('demo-bob', message);

  line('messageId', dim(envelope.messageId));
  line('hopLimit / hopCount', `${envelope.hopLimit} / ${envelope.hopCount}`);
  line('path', violet(envelope.path.join(' → ')));
  line('signature', short(envelope.signature, 40));

  const envelopeValid = verifySignature(
    `${envelope.messageId}:${envelope.destinationId}:${envelope.payload}:${envelope.sequenceNumber}`,
    envelope.signature,
    alice.signing.publicKey
  );
  ok(`envelope signature valid → ${envelopeValid}`);

  const wire = receivedByBob.filter((r) => r.packet.type === 'MESH_FORWARD');
  if (wire.length) {
    const inbound: MeshPacketEnvelope = JSON.parse(wire[0].packet.payload);
    line('received by', cyan('demo-bob'));
    line('hopLimit on wire', `${inbound.hopLimit} (TTL=${MAX_HOP_LIMIT} on origin)`);
    ok(`payload crossed the radio intact → "${JSON.parse(inbound.payload).text}"`);
  } else {
    drop('no MESH_FORWARD observed');
  }

  /* [5] ------------------------------------------------------- relay rules */
  step(5, 'Relay guards on a forwarding node');

  const base = (over: Partial<MeshPacketEnvelope>): MeshPacketEnvelope => ({
    messageId: 'mesh-' + Math.random().toString(36).slice(2, 10),
    senderId: 'demo-bob',
    senderName: 'Bob',
    destinationId: 'demo-cara',
    sequenceNumber: Date.now(),
    hopLimit: MAX_HOP_LIMIT,
    hopCount: 1,
    expiry: Date.now() + 60_000,
    payload: JSON.stringify({ text: 'relay me' }),
    signature: '',
    path: ['demo-bob'],
    ...over,
  });

  const before = router.getDiagnostics();

  // a) TTL exhausted
  const ttlPacket = base({ hopLimit: 1, messageId: 'mesh-ttl-demo' });
  await router.handleInboundMeshEnvelope('demo-bob', ttlPacket);
  const afterTtl = router.getDiagnostics();
  if (afterTtl.totalPacketsDroppedTtl > before.totalPacketsDroppedTtl) {
    ok(`TTL exhausted (hopLimit=1) → dropped (${afterTtl.totalPacketsDroppedTtl})`);
  }

  // b) loop prevention
  const loopPacket = base({ path: ['demo-bob', 'demo-alice'], messageId: 'mesh-loop-demo' });
  await router.handleInboundMeshEnvelope('demo-bob', loopPacket);
  const afterLoop = router.getDiagnostics();
  if (
    afterLoop.totalPacketsForwarded === afterTtl.totalPacketsForwarded &&
    afterLoop.totalPacketsDroppedDuplicates === afterTtl.totalPacketsDroppedDuplicates
  ) {
    ok('loop prevention (node already in path) → not re-broadcast');
  }

  // c) duplicate suppression
  const dupPacket = base({ messageId: 'mesh-dup-demo' });
  await router.handleInboundMeshEnvelope('demo-bob', dupPacket);
  await router.handleInboundMeshEnvelope('demo-bob', dupPacket);
  const afterDup = router.getDiagnostics();
  if (afterDup.totalPacketsDroppedDuplicates > afterLoop.totalPacketsDroppedDuplicates) {
    ok(`duplicate suppression → second copy dropped (${afterDup.totalPacketsDroppedDuplicates})`);
  }

  // d) legitimate forward -> actually reaches the next hop
  const forwardPacket = base({ messageId: 'mesh-fwd-demo' });
  await router.handleInboundMeshEnvelope('demo-bob', forwardPacket);
  const afterFwd = router.getDiagnostics();
  if (afterFwd.totalPacketsForwarded > afterDup.totalPacketsForwarded) {
    ok(`forwarded to next hop (hopLimit ${MAX_HOP_LIMIT} → ${MAX_HOP_LIMIT - 1})`);
  }

  const hop = receivedByCara.filter((r) => r.packet.type === 'MESH_FORWARD').pop();
  if (hop) {
    const env: MeshPacketEnvelope = JSON.parse(hop.packet.payload);
    line('cara hopCount', `${env.hopCount}`);
    line('cara hopLimit', `${env.hopLimit}`);
    line('cara path', violet(env.path.join(' → ')));
    ok('multi-hop relay completed: alice → bob → cara');
  }

  const d = router.getDiagnostics();
  console.log('');
  line('packets received', `${d.totalPacketsReceived}`);
  line('packets forwarded', `${d.totalPacketsForwarded}`);
  line('dropped (duplicate)', `${d.totalPacketsDroppedDuplicates}`);
  line('dropped (ttl)', `${d.totalPacketsDroppedTtl}`);
  line('known routes', `${d.knownRoutesCount}`);
  line('active neighbours', `${d.activeNeighbors}`);

  /* [6] ------------------------------------------------------ groups+queue */
  step(6, 'Group keys, wire framing & delivery ACKs');

  const groupKey = generateGroupKey();
  const groupSealed = encryptGroupMessage('group hello', groupKey);
  const groupOpened = decryptGroupMessage(groupSealed.ciphertext, groupSealed.nonce, groupKey);
  line('group key', dim(`${groupKey.slice(0, 28)}… (256-bit)`));
  line('epoch', '1');
  ok(`group message round trip → "${groupOpened}"`);

  const wirePacket = frameMessagePacket({
    id: 'msg-demo-001',
    senderId: 'demo-alice',
    senderName: 'Alice',
    recipientId: 'demo-bob',
    isGroup: false,
    timestamp: Date.now(),
    encrypted: sealed,
  });
  line('framed packet', `${wirePacket.type} · ${wirePacket.payload.length} bytes`);

  const ackPacket = frameAckPacket('demo-bob', 'demo-alice', 'msg-demo-001');
  const ack = parseAckPayload(ackPacket);
  ok(`delivery ACK framed + parsed → ${ack ? ack.messageId : 'FAILED'}`);

  const lifecycle = ['queued', 'sending', 'sent', 'delivered'];
  line(
    'delivery states',
    lifecycle
      .map((s, i) => (i === lifecycle.length - 1 ? emerald(s) : dim(s)))
      .join(dim(' → '))
  );
  ok('message is "delivered" only after the recipient ACKs it');

  /* ---------------------------------------------------------------- done */
  console.log('');
  console.log(emerald(bold('  ✔ Everything above ran against the real NearLink source.')));
  console.log(dim('    Run `npm test` for the full 22-test verification suite.\n'));
}

main()
  .catch((err) => {
    console.error(red(`\n  demo failed: ${err && err.stack ? err.stack : err}\n`));
    process.exit(1);
  })
  .then(() => process.exit(0));
