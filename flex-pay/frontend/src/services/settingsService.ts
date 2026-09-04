export interface SystemSettings {
  // User Preferences
  language: string;
  timezone: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  currencyDisplay: "USD" | "KHR" | "BOTH";
  autoRefresh: boolean;
  compactView: boolean;
  showTooltips: boolean;

  // Notifications
  emailAlerts: boolean;
  pushAlerts: boolean;
  soundAlerts: boolean;
  highValueAlerts: boolean;
  alertThreshold: number;

  // Security
  twoFactorAuth: boolean;
  sessionTimeout: number; // in minutes
  requirePinForTransfers: boolean;
  ipWhitelisting: boolean;

  // API Management
  apiBaseUrl: string;
  apiKey: string;
  webhookUrl: string;
  rateLimit: number;

  // Theme & Branding
  themeMode: "light" | "dark" | "system";
  accentColor: string;

  // Data & Backup
  autoBackup: boolean;
  backupFrequency: "DAILY" | "WEEKLY" | "MONTHLY";

  // Integrations
  bakongEnabled: boolean;
  abaPayWayEnabled: boolean;
  stripeEnabled: boolean;
  telegramAlerts: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  language: "en-US",
  timezone: "UTC+7",
  dateFormat: "MM/DD/YYYY",
  currencyDisplay: "USD",
  autoRefresh: true,
  compactView: false,
  showTooltips: true,

  emailAlerts: true,
  pushAlerts: true,
  soundAlerts: false,
  highValueAlerts: true,
  alertThreshold: 5000,

  twoFactorAuth: false,
  sessionTimeout: 30,
  requirePinForTransfers: true,
  ipWhitelisting: false,

  apiBaseUrl: "http://127.0.0.1:8081",
  apiKey: "flx_live_9a8b7c6d5e4f3a2b1c",
  webhookUrl: "https://api.flexpay.io/v1/webhook",
  rateLimit: 120,

  themeMode: "light",
  accentColor: "#059669",

  autoBackup: true,
  backupFrequency: "DAILY",

  bakongEnabled: true,
  abaPayWayEnabled: true,
  stripeEnabled: true,
  telegramAlerts: false,
};

const SETTINGS_KEY = "flexpay_system_settings";
const SETTINGS_CHANGE_EVENT = "flexpay_settings_changed";

export function getSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SystemSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
  applyThemeMode(settings.themeMode);
}

export function resetSettings(): SystemSettings {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: DEFAULT_SETTINGS }));
  applyThemeMode(DEFAULT_SETTINGS.themeMode);
  return DEFAULT_SETTINGS;
}

export function onSettingsChange(callback: (settings: SystemSettings) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<SystemSettings>;
    callback(custom.detail || getSettings());
  };
  window.addEventListener(SETTINGS_CHANGE_EVENT, handler);
  return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handler);
}

export function applyThemeMode(mode: "light" | "dark" | "system"): boolean {
  let isDark = false;
  if (mode === "dark") {
    isDark = true;
  } else if (mode === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    isDark = false;
  }

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  return isDark;
}
