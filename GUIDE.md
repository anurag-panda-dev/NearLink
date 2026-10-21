# NearLink Developer & Build Guide

Complete walkthrough for previewing, testing, and generating standalone Android APK files for **NearLink**.

---

## 1. Quick Start & Local Preview

### Prerequisites
- **Node.js**: v18 or later (v20+ recommended)
- **Package Manager**: npm or yarn
- **Expo Go App** (optional for quick UI preview on phone) or **Android Studio / Xcode** for native BLE development builds.

### Step 1: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2: Start the Expo Development Server
```bash
# Start standard dev server
npm run start
```
From the interactive terminal:
- Press `w` to launch the **Web preview** in your browser.
- Press `a` to launch on a connected **Android emulator / device**.
- Press `i` to launch on an **iOS simulator**.
- Scan the displayed QR code with your phone camera or Expo Go.

---

## 2. Building Standalone Android APK Files

Because NearLink uses Bluetooth Low Energy (BLE) peripheral and advertising capabilities, building a standalone APK allows you to install and test on physical devices without any developer server attached.

### Option A: Cloud Build via EAS (Recommended — No Android Studio Needed)

EAS (Expo Application Services) builds your APK in the cloud with zero local Android SDK configuration:

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Log in or Create Free Expo Account
```bash
eas login
```

#### 3. Configure EAS Build
Ensure you have `eas.json` in your project root (pre-configured for APK builds):
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

#### 4. Trigger the APK Build
```bash
eas build -p android --profile preview
```
- EAS will compile the Android app in the cloud.
- Once finished (typically 5–10 minutes), EAS provides a **direct download link & QR code** for your `.apk` file.
- Scan the QR code on your Android device to install and test immediately!

---

### Option B: Local Android APK Build (Requires Android Studio & JDK 17)

If you prefer building locally on your machine without cloud services:

#### 1. Prebuild Native Android Directory
```bash
npx expo prebuild --platform android
```

#### 2. Build Release APK via Gradle
On Windows (PowerShell):
```powershell
cd android
.\gradlew assembleRelease
```
On macOS / Linux:
```bash
cd android && ./gradlew assembleRelease
```

#### 3. Locate Your Generated APK
The standalone installable APK is located at:
```text
android/app/build/outputs/apk/release/app-release.apk
```
You can install it directly to a connected phone via ADB:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 3. Offline BLE Testing & Verification

### Physical Multi-Device Setup
1. Install the APK on **Device A** (e.g., Pixel / Samsung) and **Device B**.
2. **Turn off Wi-Fi and Cellular Data** on both devices to verify true serverless operation.
3. Open NearLink on both devices.
4. On Device A:
   - Tap **Nearby** -> Tap **Scan**.
   - Device B will appear with its signal strength (dBm).
   - Tap **Pair**.
5. Once paired:
   - Tap **Chat** to exchange end-to-end encrypted messages.
   - Verify that messages arrive with delivery checkmarks (`delivered`).
   - Compare the 6-digit **Safety Number** by tapping the shield icon.

### Multi-Hop Mesh Relay Testing
1. Place **Device A** and **Device C** out of direct Bluetooth range (e.g., different rooms or ~25 meters apart).
2. Place **Device B** in the middle as a relay node.
3. On all devices, navigate to **Settings** -> Ensure **Relay Opt-In** is enabled.
4. Open **Mesh Topology Map** (`/mesh`) on any device to view live connected hops and packet relay telemetry.
5. Send a group message from Device A to Device C. Observe the **1 hop** badge appearing on Device C!

---

## 4. Running Verification Test Suite

Run the full Gravitas automated verification suite:
```bash
npm test
```

Run TypeScript strict type checking:
```bash
npm run typecheck
```
