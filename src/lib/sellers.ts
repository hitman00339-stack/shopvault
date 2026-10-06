import fs from "fs";
import path from "path";

export interface Seller {
  id: string;
  name: string;
  platform: string;
  contact?: string;
  notes?: string;
  createdAt: string;
}

const DEFAULT_SELLERS: Seller[] = [
  {
    id: "seller-1",
    name: "Noise Authorized Store",
    platform: "AMAZON",
    contact: "seller-support@gonoise.com",
    notes: "Official seller for Noise audio and smart wearables",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seller-2",
    name: "SuperComNet",
    platform: "FLIPKART",
    contact: "supercom@retail.in",
    notes: "Top electronics seller on Flipkart",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seller-3",
    name: "FlashTech Retail",
    platform: "MYNTRA",
    contact: "flashtech@myntra-partners.com",
    notes: "Fashion apparel partner",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seller-4",
    name: "Nykaa Beauty Direct",
    platform: "NYKAA",
    contact: "brands@nykaa.com",
    notes: "Direct distributor for skincare and cosmetics",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seller-5",
    name: "Cloudtail India",
    platform: "AMAZON",
    contact: "cloudtail@amazon.in",
    notes: "Verified enterprise seller",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seller-6",
    name: "Appario Retail",
    platform: "AMAZON",
    contact: "appario@amazon.in",
    notes: "Consumer electronics partner",
    createdAt: new Date().toISOString(),
  },
];

const SELLERS_FILE_PATH = path.join(process.cwd(), "src", "lib", "sellers.json");

export function getSellers(): Seller[] {
  try {
    if (fs.existsSync(SELLERS_FILE_PATH)) {
      const data = fs.readFileSync(SELLERS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Failed to read sellers.json:", error);
  }

  // Write default sellers if not present
  try {
    fs.writeFileSync(SELLERS_FILE_PATH, JSON.stringify(DEFAULT_SELLERS, null, 2));
  } catch {
    // Ignore if write fails
  }

  return DEFAULT_SELLERS;
}

export function saveSeller(seller: { id?: string; name: string; platform: string; contact?: string; notes?: string }): Seller {
  const current = getSellers();
  if (seller.id) {
    const existingIndex = current.findIndex((s) => s.id === seller.id);
    if (existingIndex >= 0) {
      const updatedSeller: Seller = {
        ...current[existingIndex],
        name: seller.name,
        platform: seller.platform,
        contact: seller.contact,
        notes: seller.notes,
      };
      current[existingIndex] = updatedSeller;
      try {
        fs.writeFileSync(SELLERS_FILE_PATH, JSON.stringify(current, null, 2));
      } catch (error) {
        console.error("Failed to update seller:", error);
      }
      return updatedSeller;
    }
  }

  const newSeller: Seller = {
    name: seller.name,
    platform: seller.platform,
    contact: seller.contact,
    notes: seller.notes,
    id: "seller-" + Date.now(),
    createdAt: new Date().toISOString(),
  };

  const updated = [newSeller, ...current];
  try {
    fs.writeFileSync(SELLERS_FILE_PATH, JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error("Failed to save seller:", error);
  }

  return newSeller;
}

export function deleteSeller(id: string): boolean {
  const current = getSellers();
  const filtered = current.filter((s) => s.id !== id);
  try {
    fs.writeFileSync(SELLERS_FILE_PATH, JSON.stringify(filtered, null, 2));
    return true;
  } catch {
    return false;
  }
}
