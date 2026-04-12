import type { TabVisibilityConfig } from '~/components/@settings/core/types';
import { DEFAULT_TAB_CONFIG } from '~/components/@settings/core/constants';

const isBrowser = typeof window !== 'undefined';

const getEnvOverride = (key, envVal, defaultValue) => {
  if (!isBrowser) {
    return envVal !== undefined ? String(envVal) === 'true' : defaultValue;
  }

  const stored = localStorage.getItem(key);

  if (stored === null) {
    return envVal !== undefined ? String(envVal) === 'true' : defaultValue;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

export const isTabEnabledViaEnv = (tabId: string): boolean => {
  const envMap: Record<string, boolean> = {
    features: getEnvOverride(
      'show_tabFeatures',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_FEATURES : undefined,
      true,
    ),
    data: getEnvOverride(
      'show_tabData',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_DATA : undefined,
      true,
    ),
    'cloud-providers': getEnvOverride(
      'show_tabCloudProviders',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_CLOUD_PROVIDERS : undefined,
      false,
    ),
    'local-providers': getEnvOverride(
      'show_tabLocalProviders',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_LOCAL_PROVIDERS : undefined,
      false,
    ),
    github: getEnvOverride(
      'show_tabGithub',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_GITHUB : undefined,
      false,
    ),
    gitlab: getEnvOverride(
      'show_tabGitlab',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_GITLAB : undefined,
      false,
    ),
    supabase: getEnvOverride(
      'show_tabSupabase',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_SUPABASE : undefined,
      false,
    ),
    notifications: getEnvOverride(
      'show_tabNotifications',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_NOTIFICATIONS : undefined,
      false,
    ),
    'event-logs': getEnvOverride(
      'show_tabEventLogs',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_EVENT_LOGS : undefined,
      false,
    ),
    mcp: getEnvOverride(
      'show_tabMcp',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_MCP : undefined,
      false,
    ),
    'project-memory': getEnvOverride(
      'show_tabProjectMemory',
      typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOW_TAB_PROJECT_MEMORY : undefined,
      true,
    ),
  };

  if (tabId in envMap) {
    return envMap[tabId];
  }

  // Default visible tabs
  const defaultVisibleTabs = ['features', 'data', 'project-memory'];

  return defaultVisibleTabs.includes(tabId);
};

export const getVisibleTabs = (
  tabConfiguration: { userTabs: TabVisibilityConfig[] },
  notificationsEnabled: boolean,
): TabVisibilityConfig[] => {
  if (!tabConfiguration?.userTabs || !Array.isArray(tabConfiguration.userTabs)) {
    console.warn('Invalid tab configuration, using defaults');
    return DEFAULT_TAB_CONFIG as TabVisibilityConfig[];
  }

  // In user mode, only show visible user tabs
  return tabConfiguration.userTabs
    .filter((tab) => {
      if (!tab || typeof tab.id !== 'string') {
        console.warn('Invalid tab entry:', tab);
        return false;
      }

      // Hide notifications tab if notifications are disabled
      if (tab.id === 'notifications' && !notificationsEnabled) {
        return false;
      }

      // Check environment variable configuration
      if (!isTabEnabledViaEnv(tab.id as string)) {
        return false;
      }

      // Only show tabs that are explicitly visible and assigned to the user window
      return tab.visible && tab.window === 'user';
    })
    .sort((a, b) => a.order - b.order);
};

export const reorderTabs = (
  tabs: TabVisibilityConfig[],
  startIndex: number,
  endIndex: number,
): TabVisibilityConfig[] => {
  const result = Array.from(tabs);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  // Update order property
  return result.map((tab, index) => ({
    ...tab,
    order: index,
  }));
};

export const resetToDefaultConfig = (isDeveloperMode: boolean): TabVisibilityConfig[] => {
  return DEFAULT_TAB_CONFIG.map((tab) => ({
    ...tab,
    visible: isDeveloperMode ? true : tab.window === 'user',
    window: isDeveloperMode ? 'developer' : tab.window,
  })) as TabVisibilityConfig[];
};
