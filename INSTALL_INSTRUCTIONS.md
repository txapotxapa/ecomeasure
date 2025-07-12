# 📱 EcoMeasure APK Installation Instructions

## 🚨 If App Won't Install or Update:

### **Method 1: Clean Install (Recommended)**
1. **Uninstall** the old version from your phone first
2. Go to Settings → Apps → EcoMeasure → Uninstall
3. **Download** the new APK from GitHub Actions
4. **Install** the fresh APK

### **Method 2: Enable Unknown Sources**
1. Go to Settings → Security → Unknown Sources (Enable)
2. Or Settings → Apps → Chrome/Browser → Install Unknown Apps (Allow)

### **Method 3: ADB Install (Developer)**
```bash
# First uninstall old version
adb uninstall com.ecomeasure.app

# Then install new version
adb install app-debug.apk
```

## 🔧 Common Issues & Solutions:

### "App not installed" Error:
- **Cause**: Signing mismatch between versions
- **Fix**: Uninstall old version first

### "Something went wrong" Error:
- **Cause**: Version conflict or corrupted download
- **Fix**: Clear browser cache, re-download APK

### "Parse Error":
- **Cause**: Corrupted APK file
- **Fix**: Re-download from GitHub Actions

### Permission Errors:
- **Cause**: Android security settings
- **Fix**: Enable "Install from Unknown Sources"

## 📋 Installation Steps:
1. Download APK from GitHub Actions "Artifacts"
2. Extract the ZIP file to get the `.apk` file
3. Transfer APK to your phone (email, USB, cloud)
4. **Uninstall old version if it exists**
5. Tap the APK file on your phone to install
6. Allow installation from unknown sources if prompted
7. Grant permissions when the app starts

## ✅ After Installation:
The app will request these permissions:
- 📷 **Camera** - For taking vegetation photos
- 📍 **Location** - For GPS coordinates
- 💾 **Storage** - For saving data and photos

**Grant all permissions for full functionality!**