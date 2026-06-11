import assetsData from '@/data/assets.json';
import transactionsData from '@/data/transactions.json';
import projectsData from '@/data/projects.json';
import departmentsData from '@/data/departments.json';
import {
  setAssets,
  setTransactions,
  setProjects,
  setDepartments,
  isInitialized,
  markInitialized,
  getAssets,
  getTransactions,
  getProjects,
  getDepartments,
} from './storage';
import type { CarbonAsset, Transaction, ReductionProject, Department } from '@/types';

export const initializeData = (force = false): void => {
  if (!force && isInitialized()) {
    return;
  }

  const processedAssets: CarbonAsset[] = (assetsData as Array<Record<string, unknown>>).map((asset) => {
    let unitPrice = 0;
    if (asset.unitPrice !== undefined) {
      unitPrice = asset.unitPrice as number;
    } else if (asset.cost !== undefined) {
      unitPrice = asset.cost as number;
    }
    const amount = (asset.amount as number) || 0;
    const cost = Math.round(amount * unitPrice * 100) / 100;
    return {
      ...asset,
      unitPrice,
      cost,
    } as CarbonAsset;
  });

  setAssets(processedAssets);
  setTransactions(transactionsData as Transaction[]);
  setProjects(projectsData as ReductionProject[]);
  setDepartments(departmentsData as Department[]);
  markInitialized();
};

export const resetData = (): void => {
  initializeData(true);
};

export const ensureDataInitialized = (): void => {
  if (!isInitialized()) {
    initializeData();
  }
};

export const getAllData = () => {
  ensureDataInitialized();
  return {
    assets: getAssets(),
    transactions: getTransactions(),
    projects: getProjects(),
    departments: getDepartments(),
  };
};
