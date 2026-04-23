import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bluestamp.app',
  appName: 'Blue Stamp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
