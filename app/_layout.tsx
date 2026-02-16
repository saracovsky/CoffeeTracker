import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { isRunningInExpoGo } from "expo";
import { useColorScheme } from '@/src/components/useColorScheme';
import * as Sentry from '@sentry/react-native';
import { useNavigationContainerRef } from "expo-router";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/config/queryClient';
import { startCacheMetricsReporting } from '@/src/utils/sentryCacheMetrics';
import { ConditionalErrorBoundary } from '@/src/components/ConditionalErrorBoundary';
import { getMeasurementMetadata, logMeasurementConfig, getDeviceType } from '@/src/config/measurementConfig';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

const measurementMetadata = getMeasurementMetadata();

Sentry.init({
  dsn: 'https://ec0634925d8f390f5501675421e63087@o4510215921270784.ingest.de.sentry.io/4510216113094736',
  release: measurementMetadata.release,
  environment: measurementMetadata.environment,
  enableUserInteractionTracing: true,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  integrations: [navigationIntegration],
  tracesSampleRate: 1.0,
  enableNativeFramesTracking: !isRunningInExpoGo(),
  enableAppStartTracking: true,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 10000,
  profilesSampleRate: 1.0,
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      measurement_phase: measurementMetadata.phase,
      measurement_session: `session-${measurementMetadata.session}`,
      measurement_date: measurementMetadata.date,
      device_type: getDeviceType(),
      thesis_experiment: 'true',
    };

    return event;
  },
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const ref = useNavigationContainerRef();
  useEffect(() => {
    if (ref) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  useEffect(() => {
    const cleanup = startCacheMetricsReporting(5 * 60 * 1000);
    return cleanup;
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ConditionalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </ConditionalErrorBoundary>
  );
}