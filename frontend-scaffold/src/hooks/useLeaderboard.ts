import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { useWallet } from "./";
import { LeaderboardEntry } from "../types/contract";
import { env } from "../helpers/env";
import { mockLeaderboard } from "../features/mockData";
import { NetworkDetails } from "../helpers/network";
import { useWalletStore } from "../store/walletStore";
import {
  getServer,
  getLeaderboard,
  paginateLeaderboard,
  mergeLeaderboardEntries,
  invalidateLeaderboardCache,
  LEADERBOARD_DEFAULT_PAGE_SIZE,
  LEADERBOARD_CACHE_TTL_MS,
  type LeaderboardFetchContext,
} from "../services/soroban";

const READ_ONLY_SOURCE =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

/**
 * Fetches leaderboard data with RPC batching, TTL cache, and client pagination.
 */
export const useLeaderboard = (
  pageSize: number = LEADERBOARD_DEFAULT_PAGE_SIZE,
): LeaderboardData => {
  const wallet = useWallet();
  const { network } = useWalletStore();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fullBatchRef = useRef<LeaderboardEntry[]>([]);
  const nextOffsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasDataRef = useRef(false);

  const networkDetails: NetworkDetails = useMemo(
    () => ({
      network,
      networkUrl:
        network === "TESTNET" ? env.horizonUrl : "https://horizon.stellar.org",
      networkPassphrase:
        network === "TESTNET"
          ? "Test SDF Network ; September 2015"
          : "Public Global Stellar Network ; September 2015",
    }),
    [network],
  );

  const buildFetchContext = useCallback((): LeaderboardFetchContext => {
    const server = getServer(networkDetails);
    return {
      contractId: env.contractId,
      network,
      networkPassphrase: networkDetails.networkPassphrase,
      sourcePublicKey: wallet.publicKey ?? READ_ONLY_SOURCE,
      server,
    };
  }, [network, networkDetails.networkPassphrase, wallet.publicKey]);

  const applyPage = useCallback(
    (batch: LeaderboardEntry[], reset: boolean) => {
      fullBatchRef.current = batch;

      if (reset) {
        const page = paginateLeaderboard(batch, 0, pageSize);
        setEntries(page.items);
        nextOffsetRef.current = page.nextOffset ?? batch.length;
        setHasMore(page.hasMore);
        return;
      }

      const visibleCount = Math.max(nextOffsetRef.current, pageSize);
      setEntries(batch.slice(0, visibleCount));
      setHasMore(visibleCount < batch.length);
    },
    [pageSize],
  );

  const fetchLeaderboard = useCallback(
    async (options?: { background?: boolean; reset?: boolean }) => {
      if (isFetchingRef.current) {
        return;
      }

      if (env.useMockData) {
        applyPage(mockLeaderboard, true);
        setLoading(false);
        setError(null);
        return;
      }

      if (!env.contractId) {
        setEntries([]);
        setHasMore(false);
        setLoading(false);
        setError("Contract ID is not configured");
        return;
      }

      isFetchingRef.current = true;
      const shouldReset = options?.reset ?? !options?.background;

      if (!options?.background && !hasDataRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const batch = await getLeaderboard(buildFetchContext(), 0);
        const merged = shouldReset
          ? batch
          : mergeLeaderboardEntries(fullBatchRef.current, batch);

        applyPage(merged, shouldReset);
        hasDataRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch leaderboard data",
        );
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [applyPage, buildFetchContext],
  );

  useEffect(() => {
    void fetchLeaderboard({ reset: true });
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (env.useMockData) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetchLeaderboard({ background: true, reset: false });
    }, LEADERBOARD_CACHE_TTL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchLeaderboard]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) {
      return;
    }

    const page = paginateLeaderboard(
      fullBatchRef.current,
      nextOffsetRef.current,
      pageSize,
    );

    if (page.items.length === 0) {
      setHasMore(false);
      return;
    }

    setEntries((prev) => [...prev, ...page.items]);
    nextOffsetRef.current = page.nextOffset ?? fullBatchRef.current.length;
    setHasMore(page.hasMore);
  }, [hasMore, loading, pageSize]);

  const refetch = useCallback(() => {
    invalidateLeaderboardCache();
    nextOffsetRef.current = 0;
    hasDataRef.current = false;
    void fetchLeaderboard({ reset: true });
  }, [fetchLeaderboard]);

  return { entries, loading, error, hasMore, loadMore, refetch };
};
