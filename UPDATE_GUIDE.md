# How to Update the Mess Management Mobile App

## Method 1: OTA Updates (Recommended - No Rebuild Needed)

### When to Use:
- ✅ UI/UX changes
- ✅ Bug fixes
- ✅ New features (JavaScript/TypeScript only)
- ✅ Configuration changes
- ✅ Any changes that don't require native code

### Steps:

1. **Make your code changes** in the project

2. **Test locally** (optional but recommended):
   ```bash
   npm start
   ```

3. **Publish OTA update**:
   ```bash
   eas update --channel production --message "Describe your changes here"
   ```

4. **That's it!** Users will automatically get the update when they open the app.

### Example:
```bash
eas update --channel production --message "Fixed Button import error in Plans screen"
```

---

## Method 2: Rebuild APK (For Native Changes)

### When to Use:
- ✅ Added new native dependencies (camera, notifications, etc.)
- ✅ Changed app version number
- ✅ Changed app icon or splash screen
- ✅ Changed app permissions
- ✅ Changed native configuration (app.json changes)
- ✅ Major updates requiring a new APK

### Steps:

1. **Update version in `app.json`** (if needed):
   ```json
   "version": "1.0.1"  // Increment this
   ```

2. **Build new APK**:
   ```bash
   eas build --platform android --profile production
   ```

3. **Wait for build to complete** (usually 10-20 minutes)

4. **Download and distribute** the new APK to users

---

## Quick Reference

| Change Type | Method | Command |
|------------|--------|---------|
| UI/Bug Fix | OTA | `eas update --channel production --message "..."` |
| New Feature (JS) | OTA | `eas update --channel production --message "..."` |
| Native Dependency | Rebuild | `eas build --platform android --profile production` |
| App Version | Rebuild | `eas build --platform android --profile production` |
| Icon/Splash | Rebuild | `eas build --platform android --profile production` |

---

## Current Setup

- **Project ID**: `bba34f1c-e0b4-46dd-9aea-aab2a4eb3629`
- **Update Channel**: `production`
- **Runtime Version**: `appVersion` (1.0.0)
- **Build Profile**: `production` (APK)

---

## Notes

- **OTA updates are instant** - Users get updates within seconds of opening the app
- **APK rebuilds take 10-20 minutes** and require redistributing the file
- **Always test OTA updates** before publishing to production
- **Version increments** are automatic for APK builds (versionCode)




