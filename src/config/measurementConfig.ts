export const MEASUREMENT_CONFIG = {
  // Available phases:
  // - 'phase-0-baseline'            No optimization practices
  // - 'phase-1-memoization'         + React memoization (useMemo, useCallback, React.memo)
  // - 'phase-2-error-boundaries'    + Error boundaries for error handling
  // - 'phase-3-api-caching'         + API response caching with React Query
  // - 'phase-4-debouncing'          + Input debouncing (limited impact with small dataset)
  // - 'phase-5-all-combined'        All practices combined
  phase: 'phase-1-memoization',
  session: 12,
  date: new Date().toISOString().split('T')[0],
} as const;

export function getDeviceType(): 'physical' | 'simulator' {
  return 'physical';
}

export function getMeasurementMetadata() {
  return {
    phase: MEASUREMENT_CONFIG.phase,
    session: MEASUREMENT_CONFIG.session,
    date: MEASUREMENT_CONFIG.date,
    deviceType: getDeviceType(),
    release: `${MEASUREMENT_CONFIG.phase}@1.${MEASUREMENT_CONFIG.session}.0`,
    environment: MEASUREMENT_CONFIG.phase,
  };
}

export function logMeasurementConfig() {
  const metadata = getMeasurementMetadata();
  console.log('Measurement Config:', metadata);
}
