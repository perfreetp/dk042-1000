import type { CarbonAsset, Transaction, ReductionProject, Department } from '@/types';

const STORAGE_KEYS = {
  ASSETS: 'carbon_assets',
  TRANSACTIONS: 'carbon_transactions',
  PROJECTS: 'carbon_projects',
  DEPARTMENTS: 'carbon_departments',
  INITIALIZED: 'carbon_initialized',
};

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

export const getAssets = (): CarbonAsset[] => {
  return storage.get<CarbonAsset[]>(STORAGE_KEYS.ASSETS, []);
};

export const setAssets = (assets: CarbonAsset[]): void => {
  storage.set(STORAGE_KEYS.ASSETS, assets);
};

export const getTransactions = (): Transaction[] => {
  return storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
};

export const setTransactions = (transactions: Transaction[]): void => {
  storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
};

export const getProjects = (): ReductionProject[] => {
  return storage.get<ReductionProject[]>(STORAGE_KEYS.PROJECTS, []);
};

export const setProjects = (projects: ReductionProject[]): void => {
  storage.set(STORAGE_KEYS.PROJECTS, projects);
};

export const getDepartments = (): Department[] => {
  return storage.get<Department[]>(STORAGE_KEYS.DEPARTMENTS, []);
};

export const setDepartments = (departments: Department[]): void => {
  storage.set(STORAGE_KEYS.DEPARTMENTS, departments);
};

export const isInitialized = (): boolean => {
  return storage.get<boolean>(STORAGE_KEYS.INITIALIZED, false);
};

export const markInitialized = (): void => {
  storage.set(STORAGE_KEYS.INITIALIZED, true);
};

export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
};
