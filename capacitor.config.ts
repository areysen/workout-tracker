import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.workouttracker', // <- make sure this is your chosen App ID
  appName: 'Workout Tracker',            // <- your app name
  webDir: 'build',                        // <- for React apps, this MUST be 'build'
};

export default config;