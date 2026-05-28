import { create } from "zustand";
import { Subscription } from "../types/contract";

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  processingId: string | null;
  setSubscriptions: (subs: Subscription[]) => void;
  addSubscription: (sub: Subscription) => void;
  removeSubscription: (creator: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProcessingId: (id: string | null) => void;
  clearAll: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscriptions: [],
  loading: false,
  error: null,
  processingId: null,

  setSubscriptions: (subs) => set({ subscriptions: subs, error: null }),

  addSubscription: (sub) =>
    set((state) => ({
      subscriptions: [
        ...state.subscriptions.filter((s) => s.creator !== sub.creator),
        sub,
      ],
    })),

  removeSubscription: (creator) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.creator !== creator),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setProcessingId: (processingId) => set({ processingId }),
  clearAll: () =>
    set({ subscriptions: [], loading: false, error: null, processingId: null }),
}));
