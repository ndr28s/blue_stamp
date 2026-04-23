import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bluestamp.app',
  appName: 'Blue Stamp',
  webDir: 'dist',
  server: {
    // Use http scheme so the app can fetch cleartext HTTP paperclip servers
    // without mixed-content restrictions from the WebView itself.
    androidScheme: 'http',
  },
}

export default config
