export const FEATURE_FLAGS = {
  USE_API_CACHING: true,  // Change to false to disable caching
  USE_MEMOIZATION: false,  // Change to false to disable React memoization (useMemo, useCallback, React.memo)
  USE_ERROR_BOUNDARIES: false,  // Change to false to disable error boundaries (errors will crash the app)
  USE_DEBOUNCING: false,  // Change to false to disable input debouncing (immediate search)
} as const;
