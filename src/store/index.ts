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
  AssetType,
  AssetSource,
} from '@/types';

export interface BuyAssetData {
  name: string;
  type: AssetType;
  amount: number;
  unitPrice: number;
  source: AssetSource;
  year: number;
  department: string;
  projectId?: string;
  acquiredDate: string;
  expiryDate?: string;
  description?: string;
  counterparty?: string;
  transactionDate: string;
  operator: string;
  remark?: string;
}

export interface TransactionWithValidation {
  assetId: string;
  amount: number;
  unitPrice?: number;
  counterparty?: string;
  department: string;
  projectId?: string;
  transactionDate: string;
  operator: string;
  remark?: string;
}

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

  buyAsset: (data: BuyAssetData) => { success: boolean; error?: string; assetId?: string };
  sellAsset: (data: TransactionWithValidation) => { success: boolean; error?: string };
  performanceDeduction: (data: TransactionWithValidation) => { success: boolean; error?: string };
  freezeAsset: (data: Omit<TransactionWithValidation, 'unitPrice' | 'counterparty'>) => { success: boolean; error?: string };
  unfreezeAsset: (data: Omit<TransactionWithValidation, 'unitPrice' | 'counterparty'>) => { success: boolean; error?: string };

  getAvailableAssets: () => CarbonAsset[];
  getFrozenAssets: () => CarbonAsset[];
  getAssetCost: (asset: CarbonAsset) => number;

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

  buyAsset: (data) => {
    const {
      name, type, amount, unitPrice, source, year, department,
      projectId, acquiredDate, expiryDate, description,
      counterparty, transactionDate, operator, remark,
    } = data;

    if (amount <= 0) {
      return { success: false, error: '交易数量必须大于0' };
    }
    if (unitPrice < 0) {
      return { success: false, error: '单价不能为负数' };
    }

    const totalCost = amount * unitPrice;
    const now = new Date().toISOString();

    const newAsset: CarbonAsset = {
      id: generateId('asset'),
      name,
      type,
      amount,
      unit: '吨CO2e',
      source,
      status: 'available',
      year,
      department,
      projectId,
      unitPrice,
      cost: totalCost,
      acquiredDate,
      expiryDate,
      description,
      createdAt: now,
      updatedAt: now,
    };

    const newTransaction: Transaction = {
      id: generateId('trans'),
      type: 'buy',
      assetId: newAsset.id,
      assetName: name,
      assetType: type,
      amount,
      unitPrice,
      totalAmount: totalCost,
      counterparty,
      department,
      projectId,
      status: 'completed',
      transactionDate,
      operator,
      remark,
      createdAt: now,
    };

    const updatedAssets = [...get().assets, newAsset];
    const updatedTransactions = [...get().transactions, newTransaction];
    
    setAssets(updatedAssets);
    setTransactions(updatedTransactions);
    set({ assets: updatedAssets, transactions: updatedTransactions });

    return { success: true, assetId: newAsset.id };
  },

  sellAsset: (data) => {
    const { assetId, amount, unitPrice, counterparty, department, projectId, transactionDate, operator, remark } = data;
    const asset = get().getAssetById(assetId);

    if (!asset) {
      return { success: false, error: '资产不存在' };
    }
    if (asset.status !== 'available') {
      return { success: false, error: '只能卖出可用状态的资产' };
    }
    if (amount <= 0) {
      return { success: false, error: '卖出数量必须大于0' };
    }
    if (amount > asset.amount) {
      return { success: false, error: `卖出数量(${amount})不能超过可用余额(${asset.amount})` };
    }

    const totalAmount = (unitPrice || 0) * amount;
    const now = new Date().toISOString();
    const remainingAmount = asset.amount - amount;

    const newTransaction: Transaction = {
      id: generateId('trans'),
      type: 'sell',
      assetId,
      assetName: asset.name,
      assetType: asset.type,
      amount,
      unitPrice,
      totalAmount,
      counterparty,
      department,
      projectId,
      status: 'completed',
      transactionDate,
      operator,
      remark,
      createdAt: now,
    };

    const updatedTransactions = [...get().transactions, newTransaction];
    setTransactions(updatedTransactions);

    const updatedAssets = get().assets.map((a) => {
      if (a.id === assetId) {
        const assetRemaining = asset.amount - amount;
        const newStatus = remainingAmount <= 0 ? 'used' : asset.status;
        const costPerUnit = asset.amount > 0 ? asset.cost / asset.amount : 0;
        const newCost = remainingAmount * costPerUnit;
        return {
          ...a,
          amount: remainingAmount,
          cost: Math.round(newCost * 100) / 100,
          status: newStatus,
          updatedAt: now,
        };
      }
      return a;
    });

    setAssets(updatedAssets);
    set({ assets: updatedAssets, transactions: updatedTransactions });

    return { success: true };
  },

  performanceDeduction: (data) => {
    const { assetId, amount, department, projectId, transactionDate, operator, remark } = data;
    const asset = get().getAssetById(assetId);

    if (!asset) {
      return { success: false, error: '资产不存在' };
    }
    if (asset.status !== 'available') {
      return { success: false, error: '只能抵扣可用状态的资产' };
    }
    if (amount <= 0) {
      return { success: false, error: '抵扣数量必须大于0' };
    }
    if (amount > asset.amount) {
      return { success: false, error: `抵扣数量(${amount})不能超过可用余额(${asset.amount})` };
    }

    const now = new Date().toISOString();
    const remainingAmount = asset.amount - amount;

    const newTransaction: Transaction = {
      id: generateId('trans'),
      type: 'performance',
      assetId,
      assetName: asset.name,
      assetType: asset.type,
      amount,
      department,
      projectId,
      status: 'completed',
      transactionDate,
      operator,
      remark,
      createdAt: now,
    };

    const updatedTransactions = [...get().transactions, newTransaction];
    setTransactions(updatedTransactions);

    const updatedAssets = get().assets.map((a) => {
      if (a.id === assetId) {
        const newStatus = remainingAmount <= 0 ? 'used' : asset.status;
        const costPerUnit = asset.amount > 0 ? asset.cost / asset.amount : 0;
        const newCost = remainingAmount * costPerUnit;
        return {
          ...a,
          amount: remainingAmount,
          cost: Math.round(newCost * 100) / 100,
          status: newStatus,
          updatedAt: now,
        };
      }
      return a;
    });

    setAssets(updatedAssets);
    set({ assets: updatedAssets, transactions: updatedTransactions });

    return { success: true };
  },

  freezeAsset: (data) => {
    const { assetId, amount, department, projectId, transactionDate, operator, remark } = data;
    const asset = get().getAssetById(assetId);

    if (!asset) {
      return { success: false, error: '资产不存在' };
    }
    if (asset.status !== 'available') {
      return { success: false, error: '只能冻结可用状态的资产' };
    }
    if (amount <= 0) {
      return { success: false, error: '冻结数量必须大于0' };
    }
    if (amount > asset.amount) {
      return { success: false, error: `冻结数量(${amount})不能超过可用余额(${asset.amount})` };
    }

    const now = new Date().toISOString();

    const newTransaction: Transaction = {
      id: generateId('trans'),
      type: 'freeze',
      assetId,
      assetName: asset.name,
      assetType: asset.type,
      amount,
      department,
      projectId,
      status: 'completed',
      transactionDate,
      operator,
      remark,
      createdAt: now,
    };

    const updatedTransactions = [...get().transactions, newTransaction];
    setTransactions(updatedTransactions);

    if (amount >= asset.amount) {
      get().updateAssetStatus(assetId, 'frozen');
    } else {
      const frozenAsset: CarbonAsset = {
        ...asset,
        id: generateId('asset'),
        amount,
        status: 'frozen',
        unitPrice: asset.unitPrice,
        cost: Math.round(asset.unitPrice * amount * 100) / 100,
        createdAt: now,
        updatedAt: now,
      };
      
      const remainingAmount = asset.amount - amount;
      const remainingAsset = {
        ...asset,
        amount: remainingAmount,
        unitPrice: asset.unitPrice,
        cost: Math.round(asset.unitPrice * remainingAmount * 100) / 100,
        updatedAt: now,
      };

      const updatedAssets = get().assets
        .filter((a) => a.id !== assetId)
        .concat([frozenAsset, remainingAsset]);
      
      setAssets(updatedAssets);
      set({ assets: updatedAssets, transactions: updatedTransactions });
    }

    return { success: true };
  },

  unfreezeAsset: (data) => {
    const { assetId, amount, department, projectId, transactionDate, operator, remark } = data;
    const asset = get().getAssetById(assetId);

    if (!asset) {
      return { success: false, error: '资产不存在' };
    }
    if (asset.status !== 'frozen') {
      return { success: false, error: '只能解冻冻结状态的资产' };
    }
    if (amount <= 0) {
      return { success: false, error: '解冻数量必须大于0' };
    }
    if (amount > asset.amount) {
      return { success: false, error: `解冻数量(${amount})不能超过冻结余额(${asset.amount})` };
    }

    const now = new Date().toISOString();

    const newTransaction: Transaction = {
      id: generateId('trans'),
      type: 'unfreeze',
      assetId,
      assetName: asset.name,
      assetType: asset.type,
      amount,
      department,
      projectId,
      status: 'completed',
      transactionDate,
      operator,
      remark,
      createdAt: now,
    };

    const updatedTransactions = [...get().transactions, newTransaction];
    setTransactions(updatedTransactions);

    if (amount >= asset.amount) {
      get().updateAssetStatus(assetId, 'available');
    } else {
      const unfrozenAsset: CarbonAsset = {
        ...asset,
        id: generateId('asset'),
        amount,
        status: 'available',
        unitPrice: asset.unitPrice,
        cost: Math.round(asset.unitPrice * amount * 100) / 100,
        createdAt: now,
        updatedAt: now,
      };
      
      const remainingAmount = asset.amount - amount;
      const remainingAsset = {
        ...asset,
        amount: remainingAmount,
        unitPrice: asset.unitPrice,
        cost: Math.round(asset.unitPrice * remainingAmount * 100) / 100,
        updatedAt: now,
      };

      const updatedAssets = get().assets
        .filter((a) => a.id !== assetId)
        .concat([unfrozenAsset, remainingAsset]);
      
      setAssets(updatedAssets);
      set({ assets: updatedAssets, transactions: updatedTransactions });
    }

    return { success: true };
  },

  getAvailableAssets: () => {
    return get().assets.filter((a) => a.status === 'available');
  },

  getFrozenAssets: () => {
    return get().assets.filter((a) => a.status === 'frozen');
  },

  getAssetCost: (asset) => {
    return asset.amount > 0 ? asset.cost / asset.amount : 0;
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
