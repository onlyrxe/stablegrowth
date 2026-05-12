import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const STORAGE_KEYS = {
  TRANSACTIONS: 'finance-transactions',
  CATEGORIES: 'finance-categories',
  INVESTMENTS: 'finance-investments',
  SETTINGS: 'finance-settings',
  DEMO_MODE: 'finance-demo-mode',
};

export const defaultCategories = {
  expense: ['Ăn uống', 'Di chuyển', 'Giải trí', 'Học tập', 'Mua sắm', 'Hóa đơn', 'Khác'],
  income: ['Lương', 'Freelance', 'Thưởng', 'Đầu tư', 'Khác']
};

export const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error(`Error loading data for ${key}:`, e);
    return defaultValue;
  }
};

export const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving data for ${key}:`, e);
  }
};

// Seeded random for deterministic simulation
export const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};
