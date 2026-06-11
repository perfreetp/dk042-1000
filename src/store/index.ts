import { create } from 'zustand';
import {
  getAssets,
  setAssets,
  getTransactions,
  setTransactions,
  getProjects,
  setProjects,
  getDepartments,
  generateId,
} from '@/utils/storage';
import { ensureDataInitialized } from '@/utils/initData';
import type {
  CarbonAsset,
  Transaction,
  ReductionProject,
  Department,
  FilterParams,
  AssetStatus,
  TransactionType,
  TransactionStatus,
} from '@/types';

interface AppState {
  assets: CarbonAsset[];
  transactions: Transaction[];
  projects: ReductionProject[];
  departments: Department[];
  loading: boolean;
  initialized: boolean;

  initData: () => void;
  refreshAll: () => void;

  addAsset: (asset: Omit<CarbonAsset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAsset: (id: string, updates: Partial<CarbonAsset>) => void;
  updateAssetStatus: (id: string, status: AssetStatus) => void;
  filterAssets: (filters: FilterParams) => CarbonAsset[];

  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  filterTransactions: (filters: Omit<FilterParams, 'status'> & { type?: TransactionType; status?: TransactionStatus }) => Transaction[];

  addProject: (project: Omit<ReductionProject, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<ReductionProject>) => void;
  updateProjectProgress: (id: string, progress: number, actualReduction?: number, actualRevenue?: number) => void;

  getDepartmentName: (id: string) => string;
  getProjectName: (id: string) => string;
  getAssetById: (id: string) => CarbonAsset | undefined;
  getProjectById: (id: string) => ReductionProject | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  assets: [],
  transactions: [],
  projects: [],
  departments: [],
  loading: true,
  initialized: false,

  initData: () => {
    ensureDataInitialized();
    set({
      assets: getAssets(),
      transactions: getTransactions(),
      projects: getProjects(),
      departments: getDepartments(),
      loading: false,
      initialized: true,
    });
  },

  refreshAll: () => {
    set({
      assets: getAssets(),
      transactions: getTransactions(),
      projects: getProjects(),
      departments: getDepartments(),
    });
  },

  addAsset: (asset) => {
    const now = new Date().toISOString();
    const newAsset: CarbonAsset = {
      ...asset,
      id: generateId('asset'),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...get().assets, newAsset];
    setAssets(updated);
    set({ assets: updated });
  },

  updateAsset: (id, updates) => {
    const updated = get().assets.map((a) =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    setAssets(updated);
    set({ assets: updated });
  },

  updateAssetStatus: (id, status) => {
    get().updateAsset(id, { status });
  },

  filterAssets: (filters) => {
    let result = [...get().assets];

    if (filters.year) {
      result = result.filter((a) => a.year === filters.year);
    }
    if (filters.type) {
      result = result.filter((a) => a.type === filters.type);
    }
    if (filters.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    if (filters.source) {
      result = result.filter((a) => a.source === filters.source);
    }
    if (filters.department) {
      result = result.filter((a) => a.department === filters.department);
    }
    if (filters.projectId) {
      result = result.filter((a) => a.projectId === filters.projectId);
    }
    if (filters.startDate) {
      result = result.filter((a) => a.acquiredDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((a) => a.acquiredDate <= filters.endDate!);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(kw) || a.id.toLowerCase().includes(kw)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addTransaction: (transaction) => {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId('trans'),
      createdAt: now,
    };
    const updated = [...get().transactions, newTransaction];
    setTransactions(updated);
    set({ transactions: updated });

    if (transaction.type === 'performance' && transaction.status === 'completed') {
      get().updateAssetStatus(transaction.assetId, 'used');
    } else if (transaction.type === 'freeze' && transaction.status === 'completed') {
      get().updateAssetStatus(transaction.assetId, 'frozen');
    } else if (transaction.type === 'unfreeze' && transaction.status === 'completed') {
      get().updateAssetStatus(transaction.assetId, 'available');
    } else if (transaction.type === 'sell' && transaction.status === 'completed') {
      const asset = get().getAssetById(transaction.assetId);
      if (asset) {
        const newAmount = asset.amount - transaction.amount;
        if (newAmount <= 0) {
          get().updateAssetStatus(transaction.assetId, 'used');
        }
        get().updateAsset(transaction.assetId, { amount: Math.max(0, newAmount) });
      }
    }
  },

  updateTransaction: (id, updates) => {
    const updated = get().transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTransactions(updated);
    set({ transactions: updated });
  },

  filterTransactions: (filters) => {
    let result = [...get().transactions];

    if (filters.type) {
      result = result.filter((t) => t.type === filters.type);
    }
    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.department) {
      result = result.filter((t) => t.department === filters.department);
    }
    if (filters.projectId) {
      result = result.filter((t) => t.projectId === filters.projectId);
    }
    if (filters.startDate) {
      result = result.filter((t) => t.transactionDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((t) => t.transactionDate <= filters.endDate!);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (t) =>
          t.assetName.toLowerCase().includes(kw) ||
          t.id.toLowerCase().includes(kw) ||
          t.counterparty?.toLowerCase().includes(kw)
      );
    }

    return result.sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
  },

  addProject: (project) => {
    const now = new Date().toISOString();
    const newProject: ReductionProject = {
      ...project,
      id: generateId('proj'),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...get().projects, newProject];
    setProjects(updated);
    set({ projects: updated });
  },

  updateProject: (id, updates) => {
    const updated = get().projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setProjects(updated);
    set({ projects: updated });
  },

  updateProjectProgress: (id, progress, actualReduction, actualRevenue) => {
    const updates: Partial<ReductionProject> = { progress };
    if (actualReduction !== undefined) updates.actualReduction = actualReduction;
    if (actualRevenue !== undefined) updates.actualRevenue = actualRevenue;
    get().updateProject(id, updates);
  },

  getDepartmentName: (id) => {
    const dept = get().departments.find((d) => d.id === id);
    return dept?.name || id;
  },

  getProjectName: (id) => {
    const project = get().projects.find((p) => p.id === id);
    return project?.name || id;
  },

  getAssetById: (id) => {
    return get().assets.find((a) => a.id === id);
  },

  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id);
  },
}));
