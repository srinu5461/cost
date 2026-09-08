// v3.0 - Custom Virtual Scroll with Modern Admin UI
import { useState, useEffect } from 'react';
import { VirtualizedProductList } from '../../components/VirtualizedProductList';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import { RefreshCw, Database, Info, Zap, Server, Layers } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function ProductsVirtualized() {
  const [syncing, setSyncing] = useState(false);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Load database diagnostic info
    fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products-count`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => setDbInfo(data))
      .catch((err) => console.error('Failed to load DB info:', err));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    toast.loading('Starting CDN sync...', { id: 'sync' });

    try {
      let offset = 0;
      let chunkIndex = 0;
      let totalSoFar = 0;
      let uploadedChunks: string[] = [];
      const startedAt = new Date().toISOString();

      while (true) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/sync-products`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ offset, chunkIndex, totalSoFar, uploadedChunks, startedAt }),
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Sync failed');
        }

        const data = await response.json();

        if (data.done) {
          toast.success(
            `Sync complete! ${(data.totalCount || totalSoFar || 0).toLocaleString()} products in ${data.chunks ?? uploadedChunks.length} chunks.`,
            { id: 'sync', duration: 5000 }
          );
          await queryClient.invalidateQueries({ queryKey: ['products-json'] });
          setRefreshKey((prev) => prev + 1);
          break;
        }

        offset = data.nextOffset ?? offset;
        chunkIndex = data.chunkIndex ?? chunkIndex;
        totalSoFar = data.totalSoFar ?? totalSoFar;
        uploadedChunks = data.uploadedChunks ?? uploadedChunks;
        toast.loading(`Syncing... ${(totalSoFar || 0).toLocaleString()} products, ${uploadedChunks.length} chunks`, { id: 'sync' });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to sync products',
        { id: 'sync' }
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans flex flex-col h-[calc(100vh-5rem)]">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Zap className="size-6 text-[#E31837]" />
            Virtualized Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            High-performance catalog renderer powered by CDN edge cache & virtual scroll
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync to CDN'}
          </button>
        </div>
      </div>

      {/* Virtualized List Container */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <VirtualizedProductList key={refreshKey} refreshTrigger={refreshKey} />
      </div>
    </div>
  );
}

