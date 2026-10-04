// ─── General Utility Functions ───

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

// ─── Tailwind Class Merger (used by all shadcn components) ───
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting (INR) ───
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Date Formatting ───
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return formatDistanceToNow(d, { addSuffix: true });
}

// ─── Platform Helpers ───
export const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  AMAZON: {
    label: "Amazon",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-200",
    icon: "🛒",
  },
  FLIPKART: {
    label: "Flipkart",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
    icon: "🛍️",
  },
  MYNTRA: {
    label: "Myntra",
    color: "text-pink-700",
    bgColor: "bg-pink-100 border-pink-200",
    icon: "👗",
  },
  MEESHO: {
    label: "Meesho",
    color: "text-purple-700",
    bgColor: "bg-purple-100 border-purple-200",
    icon: "📦",
  },
  NYKAA: {
    label: "Nykaa",
    color: "text-rose-700",
    bgColor: "bg-rose-100 border-rose-200",
    icon: "💄",
  },
  AJIO: {
    label: "Ajio",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100 border-indigo-200",
    icon: "👔",
  },
  OTHER: {
    label: "Other",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-200",
    icon: "🏪",
  },
};

export function getPlatformConfig(platform: string) {
  return PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.OTHER;
}

// ─── Status Helpers ───
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE: {
    label: "Active",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
  },
  PAUSED: {
    label: "Paused",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-200",
  },
  EXPIRED: {
    label: "Expired",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
  },
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bgColor: "bg-amber-100 border-amber-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
  },
  APPROVED: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
  },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-200",
  };
}

// ─── String Helpers ───
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateOrderRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// ─── Validation Helpers ───
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone.replace(/\s/g, ""));
}

export function isValidUPI(upi: string): boolean {
  const regex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z]+$/;
  return regex.test(upi);
}

// ─── File Helpers ───
export function getFileSizeMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function isImageFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "");
}

// ─── Number Helpers ───
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}