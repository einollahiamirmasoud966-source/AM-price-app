const config = {
  appId: 'com.gheimatalan.app',
  appName: 'Gheimat Alan',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
