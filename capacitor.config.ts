import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecomeasure.app',
  appName: 'EcoMeasure',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    // Correct, minimal permissions for modern Android.
    // Capacitor will automatically add these to the AndroidManifest.
    Camera: {
      // No need to specify androidPermissions here, Capacitor infers them
      // from the main permissions list for standard plugins.
    },
    Geolocation: {
      // No androidPermissions needed here either.
    },
    Filesystem: {
      // Filesystem plugin does not require explicit permissions for its primary functions
      // on modern Android (scoped storage).
    },
    App: {
      handleBackButton: false // Let the JS handle back button behavior
    }
  }
};

export default config; 