import fs from "fs";
import path from "path";

export interface SystemSettings {
  telegramSupportId: string;
  telegramSupportUrl: string;
  supportNotice?: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  telegramSupportId: "ShopVaultOfficial",
  telegramSupportUrl: "https://t.me/ShopVaultOfficial",
  supportNotice: "Official VIP Telegram Concierge & Member Support (24/7 Available)",
  updatedAt: new Date().toISOString(),
};

const SETTINGS_FILE_PATH = path.join(process.cwd(), "src", "lib", "settings.json");

export function formatTelegramUrl(input: string): { id: string; url: string } {
  let cleaned = (input || "").trim();
  if (cleaned.startsWith("https://t.me/")) {
    cleaned = cleaned.replace("https://t.me/", "");
  } else if (cleaned.startsWith("http://t.me/")) {
    cleaned = cleaned.replace("http://t.me/", "");
  } else if (cleaned.startsWith("t.me/")) {
    cleaned = cleaned.replace("t.me/", "");
  }
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }
  cleaned = cleaned.trim();
  if (!cleaned) {
    return {
      id: DEFAULT_SETTINGS.telegramSupportId,
      url: DEFAULT_SETTINGS.telegramSupportUrl,
    };
  }
  return {
    id: cleaned,
    url: `https://t.me/${cleaned}`,
  };
}

export function getSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && parsed.telegramSupportId) {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };
      }
    }
  } catch (error) {
    console.warn("Failed to read settings.json:", error);
  }

  // Write default settings if file doesn't exist
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  } catch {}

  return DEFAULT_SETTINGS;
}

export function saveSettings(partial: Partial<SystemSettings>): SystemSettings {
  const current = getSettings();
  const updatedTelegram = partial.telegramSupportId
    ? formatTelegramUrl(partial.telegramSupportId)
    : { id: current.telegramSupportId, url: current.telegramSupportUrl };

  const updated: SystemSettings = {
    ...current,
    ...partial,
    telegramSupportId: updatedTelegram.id,
    telegramSupportUrl: updatedTelegram.url,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }

  return updated;
}
