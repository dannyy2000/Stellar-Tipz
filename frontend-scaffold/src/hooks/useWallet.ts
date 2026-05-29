import { useMemo, useEffect, useRef } from "react";
import { logger } from '../services/logger';
import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  FreighterModule,
  AlbedoModule,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { signTx } from "../helpers/network";
import { useWalletStore } from "../store/walletStore";
import { classifyWalletError } from "../helpers/error";

interface Freighter {
  getNetwork: () => Promise<string>;
  getAddress: () => Promise<string>;
}

let kitInstance: StellarWalletsKit | null = null;
let currentNetwork: WalletNetwork | null = null;

type DisposableWalletKit = StellarWalletsKit & {
  closeModal?: () => void;
  disconnect?: () => void | Promise<void>;
  destroy?: () => void;
  removeAllListeners?: () => void;
};

const disposeKit = (kit: StellarWalletsKit | null) => {
  const disposableKit = kit as DisposableWalletKit | null;
  if (!disposableKit) return;

  try {
    disposableKit.closeModal?.();
  } catch (error) {
    logger.warn('hooks/useWallet', 'Failed to close wallet modal during cleanup', undefined, error instanceof Error ? error : new Error(String(error)));
  }

  try {
    void disposableKit.disconnect?.();
  } catch (error) {
    logger.warn('hooks/useWallet', 'Failed to disconnect wallet kit during cleanup', undefined, error instanceof Error ? error : new Error(String(error)));
  }

  try {
    disposableKit.removeAllListeners?.();
    disposableKit.destroy?.();
  } catch (error) {
    logger.warn('hooks/useWallet', 'Failed to fully dispose wallet kit during cleanup', undefined, error instanceof Error ? error : new Error(String(error)));
  }
};

const getKit = (network: WalletNetwork) => {
  if (!kitInstance || currentNetwork !== network) {
    disposeKit(kitInstance);
    kitInstance = new StellarWalletsKit({
      network,
      selectedWalletId: FREIGHTER_ID,
      modules: [new FreighterModule(), new AlbedoModule(), new xBullModule()],
    });
    currentNetwork = network;
  }
  return kitInstance;
};

const AUTO_RECONNECT_TIMEOUT_MS = 5000;

export const SUPPORTED_WALLETS = [
  {
    id: "freighter",
    name: "Freighter",
    installUrl: "https://www.freighter.app/",
    recommended: true,
  },
  {
    id: "xbull",
    name: "xBull",
    installUrl: "https://xbull.app/",
  },
  {
    id: "albedo",
    name: "Albedo",
    installUrl: "https://albedo.link/",
  },
];

const isWalletInstalled = (id: string): boolean => {
  if (typeof window === "undefined") return false;
  const win = window as unknown as {
    freighter?: unknown;
    xBullWallet?: unknown;
    albedo?: unknown;
  };
  switch (id) {
    case "freighter":
      return !!win.freighter;
    case "xbull":
      return !!win.xBullWallet;
    case "albedo":
      return !!win.albedo;
    default:
      return false;
  }
};

export const useWallet = () => {
  const {
    wallets,
    activeWalletKey,
    publicKey,
    connected,
    connecting,
    isReconnecting,
    error,
    walletError,
    network,
    walletType,
    signingStatus,
    _hasHydrated,
    connect,
    disconnect,
    removeWallet,
    setActiveWallet,
    setConnecting,
    setReconnecting,
    setError,
    setWalletError,
    setNetwork: storeSetNetwork,
    setSigningStatus,
  } = useWalletStore();

  const kitNetwork =
    network === "PUBLIC" ? WalletNetwork.PUBLIC : WalletNetwork.TESTNET;
  const kit = useMemo(() => getKit(kitNetwork), [kitNetwork]);

  // Auto-reconnect on mount: try to re-establish the active wallet session.
  // If unavailable, remove it from the list but keep the rest.
  const hasAttemptedReconnect = useRef(false);
  useEffect(() => {
    if (hasAttemptedReconnect.current || !_hasHydrated) return;
    hasAttemptedReconnect.current = true;

    if (!walletType || connected) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        logger.warn('hooks/useWallet', 'Auto-reconnect timed out');
        setReconnecting(false);
        disconnect();
      }
    }, AUTO_RECONNECT_TIMEOUT_MS);

    setReconnecting(true);

    (async () => {
      try {
        kit.setWallet(walletType);
        const { address } = await kit.getAddress();
        if (!cancelled) {
          connect(address, walletType);
        }
      } catch (err) {
        logger.warn('hooks/useWallet', 'Auto-reconnect failed — wallet extension may be unavailable', undefined, err instanceof Error ? err : new Error(String(err)));
        if (!cancelled) {
          // Clear persisted state so we don't retry on next load
          disconnect();
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setReconnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // Only run when hydrated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
    };
  }, []);

  const actions = useMemo(
    () => ({
      /** Open the wallet selection modal and add / activate the chosen wallet. */
      connect: async () => {
        setConnecting(true);
        setError(null);
        setWalletError(null);

        let walletSelected = false;

        const startTimeout = () => {
          connectTimeoutRef.current = setTimeout(() => {
            if (!walletSelected) {
              // connection timed out
              const classified = classifyWalletError(
                new Error("Connection timed out"),
              );
              logger.error('hooks/useWallet', '[Wallet] Connection timed out after 60s');
              setWalletError(classified);
              setError(classified.message);
              setConnecting(false);
            }
          }, 60000);
        };

        const clearTimeout_ = () => {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
        };

        startTimeout();
        try {
          await kit.openModal({
            onWalletSelected: async (option) => {
              walletSelected = true;
              clearTimeout_();
              try {
                kit.setWallet(option.id);
                const { address } = await kit.getAddress();

                // Automatic network detection for better UX
                try {
                  const freighterWindow = window as unknown as {
                    freighter?: Freighter;
                  };
                  if (option.id === FREIGHTER_ID && freighterWindow.freighter) {
                    const networkDetails =
                      await freighterWindow.freighter.getNetwork();
                    const detectedNetwork =
                      networkDetails === "PUBLIC" ? "PUBLIC" : "TESTNET";
                    if (detectedNetwork !== network) {
                      storeSetNetwork(detectedNetwork);
                    }
                  }
                } catch (e) {
                  logger.warn('hooks/useWallet', '[Wallet] Network auto-detection failed', undefined, e instanceof Error ? e : new Error(String(e)));
                }

                // connect() adds to the list and makes it active
                connect(address, option.id);
              } catch (err) {
                logger.error('hooks/useWallet', '[Wallet] Wallet connection failed', undefined, err instanceof Error ? err : new Error(String(err)));
                const classified = classifyWalletError(err);
                setWalletError(classified);
                setError(classified.message);
              }
            },
          });
          clearTimeout_();
          if (!walletSelected) {
            const timeoutErr = new Error("Connection popup closed without wallet selection");
            logger.warn('hooks/useWallet', '[Wallet] Popup closed without wallet selection');
            const classified = classifyWalletError(timeoutErr);
            setWalletError(classified);
            setError(classified.message);
            setConnecting(false);
          }
        } catch (err) {
          clearTimeout_();
          logger.error('hooks/useWallet', '[Wallet] Wallet connection error', { type: 'openModal', timestamp: new Date().toISOString() }, err instanceof Error ? err : new Error(String(err)));
          const classified = classifyWalletError(err);
          setWalletError(classified);
          setError(classified.message);
          setConnecting(false);
        }
      },

      /** Disconnect all wallets. */
      disconnect: () => {
        disconnect();
      },

      /** Remove a specific wallet from the list by public key. */
      removeWallet: (key: string) => {
        removeWallet(key);
      },

      /** Switch the active (default) wallet for signing transactions. */
      setActiveWallet: (key: string) => {
        setActiveWallet(key);
      },

      setNetwork: (newNetwork: "TESTNET" | "PUBLIC") => {
        storeSetNetwork(newNetwork);
      },

      connectWallet: async (walletId: string) => {
        setConnecting(true);
        setError(null);
        try {
          kit.setWallet(walletId);
          const { address } = await kit.getAddress();

          // Automatic network detection for Freighter
          const win = window as unknown as {
            freighter?: { getNetwork: () => Promise<string> };
          };
          if (walletId === "freighter" && win.freighter) {
            try {
              const networkDetails = await win.freighter.getNetwork();
              const detectedNetwork =
                networkDetails === "PUBLIC" ? "PUBLIC" : "TESTNET";
              if (detectedNetwork !== network) {
                storeSetNetwork(detectedNetwork);
              }
            } catch (e) {
              logger.warn('hooks/useWallet', 'Network auto-detection failed', undefined, e instanceof Error ? e : new Error(String(e)));
            }
          }

          connect(address, walletId);
        } catch (err) {
          logger.error('hooks/useWallet', 'Wallet connection failed', undefined, err instanceof Error ? err : new Error(String(err)));
          setError(
            err instanceof Error ? err.message : "Failed to connect wallet",
          );
        } finally {
          setConnecting(false);
        }
      },

      isWalletInstalled,

      signTransaction: async (xdr: string): Promise<string> => {
        if (!publicKey) {
          throw new Error(
            "Please connect your wallet before signing transactions",
          );
        }

        setSigningStatus("signing");
        try {
          const signed = await signTx(xdr, publicKey, kit);
          setSigningStatus("signed");
          return signed;
        } catch (err) {
          setSigningStatus("error");
          const message = err instanceof Error ? err.message : String(err);
          // Normalise rejection/cancellation messages
          if (/cancel|reject|denied|declined|closed/i.test(message)) {
            throw new Error("Transaction rejected by user", { cause: err });
          }
          throw err;
        } finally {
          // Reset to idle after a short delay so consumers can react to the state
          setTimeout(() => setSigningStatus("idle"), 1500);
        }
      },
    }),
    [
      publicKey,
      connect,
      disconnect,
      removeWallet,
      setActiveWallet,
      setConnecting,
      setError,
      setWalletError,
      storeSetNetwork,
      setSigningStatus,
      kit,
      network,
    ],
  );

  return useMemo(
    () => ({
      /** All currently connected wallets. */
      wallets,
      /** Public key of the active wallet. */
      activeWalletKey,
      publicKey,
      connected,
      connecting,
      isReconnecting,
      error,
      walletError,
      network,
      walletType,
      signingStatus,
      setError,
      ...actions,
    }),
    [
      wallets,
      activeWalletKey,
      publicKey,
      connected,
      connecting,
      isReconnecting,
      error,
      walletError,
      network,
      walletType,
      signingStatus,
      setError,
      actions,
    ],
  );
};
