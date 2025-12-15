# Karate-Dojo vs Mess-Management Build Comparison

**Date:** Current  
**Purpose:** Compare working karate-dojo-mobile project with failing mess-management-mobile project

---

## 🎯 Key Finding: Critical Differences

The **karate-dojo-mobile** project builds successfully, while **mess-management-mobile** fails. Here are the critical differences:

---

## 📊 Side-by-Side Comparison

### 1. expo-build-properties

| Project | Has expo-build-properties? | Version | Kotlin Config |
|---------|---------------------------|---------|---------------|
| **karate-dojo** | ❌ **NO** | N/A | N/A (uses default) |
| **mess-management** | ✅ YES | `^1.0.9` | `2.0.20` (not applying) |

**Finding:** karate-dojo doesn't use expo-build-properties at all and builds successfully!

---

### 2. expo-updates

| Project | Has expo-updates? | Version | Updates Config |
|---------|------------------|---------|----------------|
| **karate-dojo** | ❌ **NO** | N/A | N/A |
| **mess-management** | ✅ YES | `~29.0.13` | Enabled with runtimeVersion |

**Finding:** karate-dojo doesn't have expo-updates, which is the module causing the KSP error!

---

### 3. expo-camera

| Project | Has expo-camera? | Version |
|---------|-----------------|---------|
| **karate-dojo** | ❌ **NO** | N/A |
| **mess-management** | ✅ YES | `~17.0.9` |

**Finding:** karate-dojo doesn't use expo-camera.

---

### 4. expo-dev-client

| Project | Has expo-dev-client? | Version |
|---------|---------------------|---------|
| **karate-dojo** | ✅ **YES** | `~6.0.18` |
| **mess-management** | ❌ NO (removed) | N/A |

**Finding:** karate-dojo HAS expo-dev-client and still builds successfully! This contradicts the theory that expo-dev-client causes the issue.

---

### 5. Updates Configuration

| Project | Updates Enabled? | runtimeVersion? | Update URL? |
|---------|-----------------|-----------------|-------------|
| **karate-dojo** | ❌ NO | ❌ NO | ❌ NO |
| **mess-management** | ✅ YES | ✅ YES (`appVersion`) | ✅ YES |

**Finding:** karate-dojo has NO updates configuration at all!

---

## 📁 Complete Configuration Files

### Karate-Dojo package.json

```json
{
  "name": "karate-dojo-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "@react-native-picker/picker": "2.11.1",
    "@supabase/supabase-js": "^2.76.1",
    "@tanstack/react-query": "^5.90.7",
    "date-fns": "^4.1.0",
    "expo": "~54.0.0",
    "expo-clipboard": "^8.0.7",
    "expo-constants": "~18.0.9",
    "expo-dev-client": "~6.0.18",
    "expo-file-system": "~19.0.19",
    "expo-font": "~14.0.9",
    "expo-image-manipulator": "~14.0.7",
    "expo-image-picker": "~17.0.8",
    "expo-linear-gradient": "~15.0.7",
    "expo-linking": "^8.0.9",
    "expo-notifications": "~0.32.13",
    "expo-router": "^6.0.14",
    "expo-sharing": "~14.0.7",
    "expo-splash-screen": "~31.0.11",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-image-viewing": "^0.2.2",
    "react-native-paper": "^5.12.0",
    "react-native-qrcode-svg": "^6.3.20",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-svg": "15.12.1",
    "react-native-view-shot": "^4.0.3",
    "scheduler": "^0.27.0",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.4.3",
    "@types/jest": "^29.5.12",
    "@types/react": "~19.1.10",
    "babel-plugin-module-resolver": "^5.0.2",
    "babel-preset-expo": "^54.0.7",
    "dotenv": "^17.2.3",
    "jest": "^29.7.0",
    "jest-expo": "~54.0.13",
    "react-refresh": "^0.18.0",
    "react-test-renderer": "19.1.0",
    "tsx": "^4.20.6",
    "typescript": "^5.0.0"
  },
  "private": true
}
```

**Key Differences:**
- ❌ NO `expo-build-properties`
- ❌ NO `expo-updates`
- ❌ NO `expo-camera`
- ✅ HAS `expo-dev-client` (and builds fine!)
- ✅ HAS `expo-image-manipulator` (mess-management doesn't have this)

---

### Karate-Dojo app.json

```json
{
  "expo": {
    "name": "Karate",
    "slug": "karate-dojo-mobile",
    "version": "1.0.5",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "icon": "./assets/karateicon.png",
    "splash": {
      "image": "./assets/karateicon.png",
      "backgroundColor": "#FFF8E7",
      "resizeMode": "contain"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.karatedojo.mobile"
    },
    "android": {
      "package": "com.karatedojo.mobile",
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ]
    },
    "web": {},
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/karateicon.png",
          "resizeMode": "contain",
          "backgroundColor": "#FFF8E7"
        }
      ],
      "expo-notifications",
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them.",
          "cameraPermission": "The app accesses your camera to let you take photos."
        }
      ],
      "expo-font"
    ],
    "scheme": "karate-dojo",
    "extra": {
      "router": {},
      "eas": {
        "projectId": "e8aab9ff-c804-4028-bcbc-3f1621c8f859"
      }
    }
  }
}
```

**Key Differences:**
- ❌ NO `expo-build-properties` plugin
- ❌ NO `expo-camera` plugin
- ❌ NO `updates` configuration
- ❌ NO `runtimeVersion` configuration
- ✅ Simpler plugin list (only 4 plugins vs 7 in mess-management)

---

### Karate-Dojo eas.json

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Key Differences:**
- ✅ Identical to mess-management (no differences here)

---

### Karate-Dojo babel.config.js

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  };
};
```

**Key Differences:**
- ✅ Identical to mess-management

---

### Karate-Dojo tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "extends": "expo/tsconfig.base"
}
```

**Key Differences:**
- ✅ Identical to mess-management

---

### Karate-Dojo .npmrc

```
legacy-peer-deps=true
```

**Key Differences:**
- ✅ Identical to mess-management

---

## 🔍 Critical Analysis

### Why Karate-Dojo Builds Successfully:

1. **NO expo-updates** - This is the module causing the KSP error in mess-management
2. **NO expo-build-properties** - No Kotlin version override needed (uses Expo default)
3. **NO expo-camera** - One less native module that could cause conflicts
4. **Simpler plugin configuration** - Fewer plugins = fewer potential conflicts
5. **Uses default Kotlin version** - Expo SDK 54 default works fine when expo-updates is not present

### Why Mess-Management Fails:

1. **HAS expo-updates** - This module requires Kotlin 2.0.x but build is using 1.9.24
2. **HAS expo-build-properties** - Trying to override Kotlin but override isn't being applied
3. **HAS expo-camera** - Additional native module complexity
4. **Updates configuration** - Requires runtimeVersion and update URL, which might trigger KSP compilation

---

## 💡 Root Cause Hypothesis

### The Real Issue:

**expo-updates module in Expo SDK 54 has a hardcoded or default Kotlin version requirement of 1.9.24**, which conflicts with:
- The KSP plugin requiring Kotlin 2.0.x
- The expo-build-properties plugin trying to set Kotlin 2.0.20

**When expo-updates is present:**
- It triggers KSP compilation (`:expo-updates:kspReleaseKotlin`)
- KSP expects Kotlin 2.0.x
- But expo-updates is using Kotlin 1.9.24
- Build fails

**When expo-updates is NOT present (like karate-dojo):**
- No KSP compilation for expo-updates
- No Kotlin version conflict
- Build succeeds

---

## 🎯 Solution Options

### Option 1: Remove expo-updates (Quick Fix)
- **Action:** Remove `expo-updates` from dependencies
- **Action:** Remove `updates` and `runtimeVersion` from `app.json`
- **Action:** Remove `expo-build-properties` (not needed without updates)
- **Pros:** Build will succeed immediately
- **Cons:** No OTA updates capability

### Option 2: Wait for Expo Fix
- **Action:** Report bug to Expo team
- **Action:** Wait for fix in future SDK version
- **Pros:** Keeps OTA updates
- **Cons:** Unknown timeline

### Option 3: Try Different expo-updates Version
- **Action:** Try downgrading or upgrading `expo-updates`
- **Action:** Check if different version works with Kotlin 2.0.20
- **Pros:** Might work
- **Cons:** May break other functionality

### Option 4: Use Prebuild to Generate Native Code
- **Action:** Run `npx expo prebuild` to generate `android/` folder
- **Action:** Manually set Kotlin version in `android/build.gradle`
- **Action:** Switch to bare workflow
- **Pros:** Full control over Kotlin version
- **Cons:** More complex, harder to maintain

---

## 📋 Package Comparison Table

| Package | Karate-Dojo | Mess-Management | Status |
|---------|-------------|-----------------|--------|
| `expo` | `~54.0.0` | `~54.0.0` | ✅ Same |
| `expo-router` | `^6.0.14` | `^6.0.14` | ✅ Same |
| `expo-splash-screen` | `~31.0.11` | `~31.0.11` | ✅ Same |
| `expo-notifications` | `~0.32.13` | `~0.32.13` | ✅ Same |
| `expo-image-picker` | `~17.0.8` | `~17.0.8` | ✅ Same |
| `expo-font` | `~14.0.9` | `~14.0.9` | ✅ Same |
| `expo-dev-client` | `~6.0.18` | ❌ Removed | ⚠️ Different |
| `expo-updates` | ❌ **NO** | `~29.0.13` | ❌ **KEY DIFFERENCE** |
| `expo-build-properties` | ❌ **NO** | `^1.0.9` | ❌ **KEY DIFFERENCE** |
| `expo-camera` | ❌ **NO** | `~17.0.9` | ❌ **KEY DIFFERENCE** |
| `expo-image-manipulator` | `~14.0.7` | ❌ NO | ⚠️ Different |
| `react` | `19.1.0` | `19.1.0` | ✅ Same |
| `react-native` | `0.81.5` | `0.81.5` | ✅ Same |

---

## 🔑 Key Takeaways

1. **expo-updates is the root cause** - The module causing the KSP error
2. **expo-build-properties can't override expo-updates Kotlin version** - The override isn't working
3. **expo-dev-client is NOT the issue** - karate-dojo has it and builds fine
4. **Simpler is better** - karate-dojo has fewer native modules and builds successfully
5. **Default Kotlin version works** - When expo-updates isn't present, default Kotlin works fine

---

## 🎯 Recommended Solution

### Immediate Fix: Remove expo-updates

Since karate-dojo builds successfully without expo-updates, the quickest solution is to remove it from mess-management:

1. **Remove expo-updates:**
   ```bash
   npm uninstall expo-updates
   ```

2. **Remove from app.json:**
   - Remove `updates` block
   - Remove `runtimeVersion` block

3. **Remove expo-build-properties (not needed without updates):**
   ```bash
   npm uninstall expo-build-properties
   ```
   - Remove from `app.json` plugins

4. **Rebuild:**
   ```bash
   eas build --platform android --profile production --clear-cache
   ```

**This should make mess-management build successfully, just like karate-dojo.**

---

## 📝 Alternative: Keep Updates but Fix Kotlin

If OTA updates are required, try:

1. **Check expo-updates source code** for hardcoded Kotlin version
2. **Try expo-updates version** that supports Kotlin 2.0.x
3. **Use prebuild** to manually set Kotlin version in native code
4. **Report bug to Expo** and wait for fix

---

**END OF COMPARISON DOCUMENT**



