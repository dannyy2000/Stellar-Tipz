import { useState, useEffect } from 'react';
import { secureStorage } from '../services/secureStorage';
import { logger } from '../services/logger';

export interface Settings {
    tipNotifications: boolean;
    leaderboardNotifications: boolean;
    systemNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'es' | 'fr';
    currency: 'USD' | 'EUR' | 'XLM';
    publicProfile: boolean;
    showOnLeaderboard: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    tipNotifications: true,
    leaderboardNotifications: true,
    systemNotifications: true,
    theme: 'auto',
    language: 'en',
    currency: 'USD',
    publicProfile: true,
    showOnLeaderboard: true,
};

const STORAGE_KEY = 'tipz_settings';

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from localStorage on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const saved = await secureStorage.get(STORAGE_KEY);
                if (saved) {
                    setSettings({ ...DEFAULT_SETTINGS, ...saved });
                }
            } catch (error) {
                logger.error('hooks/useSettings', 'Failed to load settings', undefined, error instanceof Error ? error : new Error(String(error)));
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const updateSettings = async (updates: Partial<Settings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        try {
            await secureStorage.set(STORAGE_KEY, newSettings);
        } catch (error) {
            logger.error('hooks/useSettings', 'Failed to save settings', undefined, error instanceof Error ? error : new Error(String(error)));
        }
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        try {
            secureStorage.remove(STORAGE_KEY);
        } catch (error) {
            logger.error('hooks/useSettings', 'Failed to reset settings', undefined, error instanceof Error ? error : new Error(String(error)));
        }
    };

    return {
        settings,
        updateSettings,
        resetSettings,
        isLoading,
    };
};

export default useSettings;
