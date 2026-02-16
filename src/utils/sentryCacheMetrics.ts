import * as Sentry from '@sentry/react-native';

class CacheMetricsTracker {
  private cacheHits = 0;
  private cacheMisses = 0;
  private totalQueries = 0;
  private bandwidthSavedBytes = 0;

  recordCacheHit(queryKey: unknown[], dataSizeInBytes: number = 1024) {
    this.cacheHits++;
    this.totalQueries++;
    this.bandwidthSavedBytes += dataSizeInBytes;
    const currentRate = this.getHitRate();

    Sentry.startSpan(
      {
        op: 'cache.get',
        name: `React Query Cache Get: ${JSON.stringify(queryKey)}`,
        attributes: {
          'cache.key': JSON.stringify(queryKey),
          'cache.hit': true,
        },
      },
      (span) => {
        if (span) {
          (span as any).setMeasurement('cache.hit_rate', currentRate);
          (span as any).setMeasurement('cache.total_queries', this.totalQueries);
          (span as any).setMeasurement('cache.bandwidth_saved', dataSizeInBytes);
        }
      }
    );

    Sentry.addBreadcrumb({
      category: 'cache',
      message: 'Cache hit',
      level: 'debug',
      data: {
        queryKey: JSON.stringify(queryKey),
        hitRate: this.getHitRate(),
        totalQueries: this.totalQueries,
        bandwidthSaved: dataSizeInBytes,
      },
    });
  }

  async recordCacheMiss(queryKey: unknown[]) {
    this.cacheMisses++;
    this.totalQueries++;

    Sentry.startSpan(
      {
        op: 'cache.get',
        name: `React Query Cache Get: ${JSON.stringify(queryKey)}`,
        attributes: {
          'cache.key': JSON.stringify(queryKey),
          'cache.hit': false,
          'cache.hit_rate': this.getHitRate(),
          'cache.total_queries': this.totalQueries,
        },
      },
      () => {}
    );

    Sentry.addBreadcrumb({
      category: 'cache',
      message: 'Cache miss - fetching from network',
      level: 'debug',
      data: {
        queryKey: JSON.stringify(queryKey),
        hitRate: this.getHitRate(),
        totalQueries: this.totalQueries,
      },
    });
  }

  recordCachePut(queryKey: unknown[], dataSize?: number) {
    Sentry.startSpan(
      {
        op: 'cache.put',
        name: `React Query Cache Put: ${JSON.stringify(queryKey)}`,
        attributes: {
          'cache.key': JSON.stringify(queryKey),
          ...(dataSize && { 'cache.item_size': dataSize }),
        },
      },
      () => {}
    );

    Sentry.addBreadcrumb({
      category: 'cache',
      message: 'Cache put',
      level: 'debug',
      data: {
        queryKey: JSON.stringify(queryKey),
        dataSize,
      },
    });
  }

  getHitRate(): number {
    if (this.totalQueries === 0) return 0;
    return (this.cacheHits / this.totalQueries) * 100;
  }

  getStats() {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      totalQueries: this.totalQueries,
      hitRate: this.getHitRate(),
      bandwidthSavedBytes: this.bandwidthSavedBytes,
    };
  }

  sendMetricsToSentry() {
    const stats = this.getStats();

    if (stats.totalQueries === 0) {
      return;
    }

    Sentry.captureMessage('Cache Performance Metrics', {
      level: 'info',
      tags: {
        metric_type: 'cache_performance',
      },
      extra: {
        cacheHits: stats.cacheHits,
        cacheMisses: stats.cacheMisses,
        totalQueries: stats.totalQueries,
        hitRate: stats.hitRate.toFixed(2) + '%',
        bandwidthSavedBytes: stats.bandwidthSavedBytes,
        bandwidthSavedKB: (stats.bandwidthSavedBytes / 1024).toFixed(2) + ' KB',
        bandwidthSavedMB: (stats.bandwidthSavedBytes / 1024 / 1024).toFixed(2) + ' MB',
      },
    });
  }

  reset() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalQueries = 0;
    this.bandwidthSavedBytes = 0;
  }

  sendAndReset() {
    this.sendMetricsToSentry();
    this.reset();
  }
}

export const cacheMetricsTracker = new CacheMetricsTracker();

export function startCacheMetricsReporting(intervalMs: number = 5 * 60 * 1000): () => void {
  const intervalId = setInterval(() => {
    cacheMetricsTracker.sendAndReset();
  }, intervalMs);

  return () => {
    clearInterval(intervalId);
    cacheMetricsTracker.sendMetricsToSentry();
  };
}
