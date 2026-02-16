# CoffeeTracker

A cross-platform mobile application for tracking coffee purchases in System Research Group. Built as part of a thesis project to evaluate the impact of React Native optimization practices such as API caching, memoisation, debouncing and error boundaries on app performance. Optimization practices are isolated via feature flags. 

## Tech Stack

- **React Native** 0.81.5 with **Expo** v54 and Expo Router
- **Zustand** for state management
- **React Query** (@tanstack/react-query) for API caching
- **Sentry** for error tracking and performance monitoring
- **TypeScript**

## Getting Started

### Prerequisites

- Node.js (v18+)

### Installation

```bash
npm install
```

### Running the App

```bash
npx expo start          # Start Expo dev server
npx expo run:ios        # Run on iOS simulator
npx expo run:android    # Run on Android emulator
npx expo start --web    # Run in browser
```

## Feature Flags

The app uses feature flags (`src/config/featureFlags.ts`) to toggle optimization practices for thesis measurements:

| Flag | Description |
|------|-------------|
| `USE_API_CACHING` | React Query API response caching |
| `USE_MEMOIZATION` | React memoization (useMemo, useCallback, React.memo) |
| `USE_ERROR_BOUNDARIES` | Error boundaries for graceful error handling |
| `USE_DEBOUNCING` | Input debouncing for search |

Measurement phases are configured in `src/config/measurementConfig.ts`.
