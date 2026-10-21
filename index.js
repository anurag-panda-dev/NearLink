// Custom Expo Router entry: crypto polyfill MUST be evaluated before any
// module touches tweetnacl — nacl captures self.crypto.getRandomValues at
// module load time (tweetnacl/nacl-fast.js) and throws "no PRNG" forever
// if it's absent at that moment. React Native/Hermes has no built-in
// crypto.getRandomValues, so react-native-get-random-values (backed by
// expo-crypto) has to run first. On web it's a no-op (browser crypto exists).
import 'react-native-get-random-values';
import 'expo-router/entry';
