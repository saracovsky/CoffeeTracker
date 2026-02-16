import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { FEATURE_FLAGS } from '../config/featureFlags';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PinErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only use error boundary if feature flag is enabled
    if (!FEATURE_FLAGS.USE_ERROR_BOUNDARIES) {
      // Re-throw the error to let the app crash
      throw error;
    }

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        error_boundary: 'PinErrorBoundary',
        component: 'PIN_OPERATIONS',
      },
      extra: {
        errorInfo,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    // If error boundaries are disabled, just render children
    if (!FEATURE_FLAGS.USE_ERROR_BOUNDARIES) {
      return this.props.children;
    }

    // If there's an error and error boundaries are enabled, show fallback UI
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>PIN Operation Failed</Text>
            <Text style={styles.errorMessage}>
              We encountered an issue with the PIN operation. This might be due to:
            </Text>
            <View style={styles.reasonsList}>
              <Text style={styles.reasonItem}>• Network connectivity issues</Text>
              <Text style={styles.reasonItem}>• Invalid PIN configuration</Text>
              <Text style={styles.reasonItem}>• Server error</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info (dev only):</Text>
                <Text style={styles.debugText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  reasonsList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  reasonItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
});
