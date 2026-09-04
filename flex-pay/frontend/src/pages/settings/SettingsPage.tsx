import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Code2,
  Palette,
  Database,
  Layers,
  RotateCcw,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Copy,
  Check,
  Globe,
  Sliders,
  Smartphone,
  CreditCard
} from "lucide-react";
import {
  getSettings,
  saveSettings,
  resetSettings,
  type SystemSettings,
} from "../../services/settingsService";

type CategoryKey =
  | "user"
  | "notifications"
  | "security"
  | "api"
  | "theme"
  | "backup"
  | "integrations";

interface CategoryItem {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  { key: "user", label: "User Preferences", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "api", label: "API Management", icon: Code2 },
  { key: "theme", label: "Theme & Branding", icon: Palette },
  { key: "backup", label: "Data & Backup", icon: Database },
  { key: "integrations", label: "Integrations", icon: Layers },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("user");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function showToast(message: string, type: "success" | "info" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    saveSettings(settings);
    showToast("Settings saved successfully!");
  }

  function handleReset() {
    if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
      const def = resetSettings();
      setSettings(def);
      showToast("Settings reset to defaults.", "info");
    }
  }

  function handleCopyApiKey() {
    navigator.clipboard.writeText(settings.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast("API Key copied to clipboard!");
  }

  return (
    <div className="flex-1 space-y-6 max-w-[1400px] pb-12">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-100 px-4 py-3 text-xs font-bold text-white dark:text-slate-900 shadow-2xl transition-all animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          {toast.message}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Settings</span>
          </div>
          <h1 className="font-['Manrope',sans-serif] text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            System Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure system preferences, security settings, API management, and integrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="smooth-btn inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="smooth-btn inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings Body Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Category Menu */}
        <div className="md:col-span-4 lg:col-span-3 rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Settings Categories
          </p>
          <nav className="mt-2 space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 translate-x-1"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-lg ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`}>
                    <Icon size={16} />
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Category Detail Form */}
        <div className="md:col-span-8 lg:col-span-9 rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          {/* USER PREFERENCES */}
          {activeCategory === "user" && (
            <div className="space-y-8 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Preferences</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize your localization and interface options.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Language */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="km-KH">Khmer (ភាសាខ្មែរ)</option>
                    <option value="zh-CN">Chinese (中文)</option>
                    <option value="fr-FR">French (Français)</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UTC+7">UTC+7 (Indochina Time - Phnom Penh / Bangkok)</option>
                    <option value="UTC-8">UTC-8 (Pacific Standard Time)</option>
                    <option value="UTC-5">UTC-5 (Eastern Standard Time)</option>
                    <option value="UTC+0">UTC+0 (Greenwich Mean Time)</option>
                    <option value="UTC+8">UTC+8 (Singapore / Beijing)</option>
                    <option value="UTC+9">UTC+9 (Tokyo Standard Time)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Date Format</label>
                  <div className="space-y-2 mt-1">
                    {(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const).map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="dateFormat"
                          checked={settings.dateFormat === fmt}
                          onChange={() => setSettings({ ...settings, dateFormat: fmt })}
                          className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span>{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Currency Display */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Currency Display</label>
                  <select
                    value={settings.currencyDisplay}
                    onChange={(e) => setSettings({ ...settings, currencyDisplay: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                    <option value="BOTH">Dual (USD & KHR)</option>
                  </select>
                </div>
              </div>

              {/* Dashboard Preferences Sub-Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Dashboard Preferences</h3>
                <div className="space-y-4">
                  {/* Auto-refresh */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto-refresh dashboard</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Automatically update data every 30 seconds</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoRefresh}
                        onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Compact view mode */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Compact view mode</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Show more data in less space</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.compactView}
                        onChange={(e) => setSettings({ ...settings, compactView: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Show tooltips */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Show tooltips</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Display helpful hints and explanations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showTooltips}
                        onChange={(e) => setSettings({ ...settings, showTooltips: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeCategory === "notifications" && (
            <div className="space-y-6 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control how and when administrative alerts are dispatched.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Alerts</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Send daily digest and security warnings to admin email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Push Notifications</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Receive real-time notifications in your web browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.pushAlerts}
                      onChange={(e) => setSettings({ ...settings, pushAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Sound Effects</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Play a pleasant sound when receiving incoming transactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundAlerts}
                      onChange={(e) => setSettings({ ...settings, soundAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">High-Value Transaction Threshold</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Trigger immediate escalation for amounts above this value</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">${settings.alertThreshold.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={20000}
                    step={500}
                    value={settings.alertThreshold}
                    onChange={(e) => setSettings({ ...settings, alertThreshold: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeCategory === "security" && (
            <div className="space-y-6 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Access Control</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage administrative authorization and policy rules.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Require authenticator app code on admin login</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Require PIN for Transfers</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Enforce 6-digit PIN verification on all client transactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requirePinForTransfers}
                      onChange={(e) => setSettings({ ...settings, requirePinForTransfers: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Session Inactivity Timeout</label>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Recommended)</option>
                    <option value={60}>1 Hour</option>
                    <option value={240}>4 Hours</option>
                    <option value={0}>Never Expire (Development Only)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* API MANAGEMENT */}
          {activeCategory === "api" && (
            <div className="space-y-6 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">API Management</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure endpoints, secret keys, and webhook integration.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Spring Boot API Base URL</label>
                  <input
                    type="text"
                    value={settings.apiBaseUrl}
                    onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Admin API Secret Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      readOnly
                      value={settings.apiKey}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyApiKey}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedKey ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Webhook Callback URL</label>
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://your-domain.com/webhook"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* THEME & BRANDING */}
          {activeCategory === "theme" && (
            <div className="space-y-6 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Theme & Branding</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle between Dark Mode and Original Light Mode, plus accent colors.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Appearance Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { mode: "light", label: "Original (Light)", icon: Sun },
                      { mode: "dark", label: "Dark Mode", icon: Moon },
                      { mode: "system", label: "System Sync", icon: Sliders },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = settings.themeMode === item.mode;
                      return (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => {
                            const updated = { ...settings, themeMode: item.mode as any };
                            setSettings(updated);
                            saveSettings(updated);
                          }}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/20"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <Icon size={20} className={isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Accent Theme Palette</label>
                  <div className="flex items-center gap-3">
                    {[
                      { name: "Emerald Green", color: "#059669" },
                      { name: "Flex Blue", color: "#2563eb" },
                      { name: "Indigo", color: "#6366f1" },
                      { name: "Purple", color: "#9333ea" },
                      { name: "Amber", color: "#d97706" },
                    ].map((palette) => (
                      <button
                        key={palette.color}
                        type="button"
                        onClick={() => setSettings({ ...settings, accentColor: palette.color })}
                        style={{ background: palette.color }}
                        title={palette.name}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-sm ${
                          settings.accentColor === palette.color ? "ring-4 ring-offset-2 ring-slate-400 scale-105" : ""
                        }`}
                      >
                        {settings.accentColor === palette.color && <Check size={16} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATA & BACKUP */}
          {activeCategory === "backup" && (
            <div className="space-y-6 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data & Backup</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage data persistence, exports, and automated backup schedules.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Automated Cloud Backup</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Periodically snapshot database to secure storage</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const data = {
                        exportedAt: new Date().toISOString(),
                        settings,
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `flexpay-backup-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      showToast("Backup exported successfully!");
                    }}
                    className="smooth-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Database size={14} /> Export Backup JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast("System cache purged successfully!");
                    }}
                    className="smooth-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Clear Local Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeCategory === "integrations" && (
            <div className="space-y-6 animate-page">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment & Service Integrations</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle external payment rails and notification webhooks.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "bakongEnabled", label: "Bakong KHQR", subtitle: "National Bank of Cambodia QR payment rail", icon: Smartphone, color: "text-red-500" },
                  { key: "abaPayWayEnabled", label: "ABA PayWay", subtitle: "Direct integration with ABA merchant checkout", icon: CreditCard, color: "text-sky-600" },
                  { key: "stripeEnabled", label: "Visa / Mastercard (Stripe)", subtitle: "International debit and credit card processing", icon: Globe, color: "text-indigo-600" },
                  { key: "telegramAlerts", label: "Telegram Bot Alerting", subtitle: "Instant transaction alerts in designated group", icon: Bell, color: "text-emerald-500" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = Boolean((settings as any)[item.key]);
                  return (
                    <div key={item.key} className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${item.color}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
