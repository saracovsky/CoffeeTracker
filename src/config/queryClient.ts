import { QueryClient, QueryCache } from '@tanstack/react-query';
import { cacheMetricsTracker } from '../utils/sentryCacheMetrics';

const queryFetchStartData = new WeakMap<any, { hadDataBefore: boolean, dataAge: number }>();

const queryCache = new QueryCache({
  onSuccess: (data, query) => {
    const fetchStartInfo = queryFetchStartData.get(query);
    const hadDataBefore = fetchStartInfo?.hadDataBefore ?? false;
    
    queryFetchStartData.delete(query);

    if (!hadDataBefore) {
      cacheMetricsTracker.recordCacheMiss([...query.queryKey]);
    } else {
      cacheMetricsTracker.recordCacheHit([...query.queryKey]);
    }

    const dataSize = JSON.stringify(data).length;
    cacheMetricsTracker.recordCachePut([...query.queryKey], dataSize);
  },
  onError: (_error, query) => {
    const fetchStartInfo = queryFetchStartData.get(query);
    const hadDataBefore = fetchStartInfo?.hadDataBefore ?? false;

    if (!hadDataBefore) {
      cacheMetricsTracker.recordCacheMiss([...query.queryKey]);
    }
  },
});

queryCache.subscribe((event) => {
  if (event?.type === 'observerAdded' || event?.type === 'updated') {
    const query = event.query;

    if (query.state.fetchStatus === 'fetching') {
      // Check if we have data AND if that data is not just a placeholder
      const hadDataBefore = 
        query.state.data !== undefined && 
        query.state.dataUpdatedAt > 0;

      if (!queryFetchStartData.has(query)) {
        queryFetchStartData.set(query, {
          hadDataBefore,
          dataAge: Date.now() - query.state.dataUpdatedAt
        });
      }
    }
  }
});

export const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
        gcTime: 1000 * 60 * 5, 
        staleTime: 1000 * 60 * 5,
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
    },
    mutations: {
      retry: 0, 
    },
  },
});