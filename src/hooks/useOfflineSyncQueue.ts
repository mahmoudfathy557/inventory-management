import { useState, useEffect, useCallback } from 'react';
import { offlineSyncQueue } from '../services/offlineSyncQueue';
import { QueuedSyncItem, SyncQueueStats, OdooConfig } from '../types';

export function useOfflineSyncQueue(odooConfig?: OdooConfig) {
  const [items, setItems] = useState<QueuedSyncItem[]>([]);
  const [stats, setStats] = useState<SyncQueueStats>({
    total: 0,
    queued: 0,
    syncing: 0,
    synced: 0,
    failed: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      const allItems = await offlineSyncQueue.getAllItems();
      const currentStats = await offlineSyncQueue.getStats();
      setItems(allItems);
      setStats(currentStats);
    } catch (err) {
      console.warn('[useOfflineSyncQueue] Failed to load sync queue:', err);
    }
  }, []);

  useEffect(() => {
    refreshQueue();

    // Subscribe to service updates (BroadcastChannel + internal changes)
    const unsubscribe = offlineSyncQueue.subscribe(() => {
      refreshQueue();
    });

    const handleOnline = () => {
      setIsOnline(true);
      if (!simulatedOffline) {
        offlineSyncQueue.triggerSync(odooConfig);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshQueue, odooConfig, simulatedOffline]);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await offlineSyncQueue.triggerSync(odooConfig);
      await refreshQueue();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [odooConfig, refreshQueue]);

  const retryItem = useCallback(
    async (id: string) => {
      setIsSyncing(true);
      try {
        const ok = await offlineSyncQueue.retryItem(id, odooConfig);
        await refreshQueue();
        return ok;
      } finally {
        setIsSyncing(false);
      }
    },
    [odooConfig, refreshQueue]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await offlineSyncQueue.deleteItem(id);
      await refreshQueue();
    },
    [refreshQueue]
  );

  const clearSynced = useCallback(async () => {
    await offlineSyncQueue.clearSynced();
    await refreshQueue();
  }, [refreshQueue]);

  const toggleSimulateOffline = useCallback(() => {
    setSimulatedOffline((prev) => {
      const next = !prev;
      if (!next && isOnline) {
        // Returned online from simulation
        offlineSyncQueue.triggerSync(odooConfig);
      }
      return next;
    });
  }, [isOnline, odooConfig]);

  const effectiveIsOnline = simulatedOffline ? false : isOnline;

  return {
    items,
    stats,
    pendingCount: stats.queued + stats.syncing,
    isSyncing,
    isOnline: effectiveIsOnline,
    realIsOnline: isOnline,
    simulatedOffline,
    toggleSimulateOffline,
    triggerSync,
    retryItem,
    deleteItem,
    clearSynced,
    refreshQueue
  };
}
