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

function migrateAssetUnitPrice(asset: Record<string, unknown>): { unitPrice: number; cost: number } {
  const amount = (asset.amount as number) || 0;
  const rawCost = asset.cost as number | undefined;
  const rawUnitPrice = asset.unitPrice as number | undefined;

  if (rawUnitPrice !== undefined && rawUnitPrice !== null && !isNaN(rawUnitPrice)) {
    const unitPrice = rawUnitPrice;
    const cost = Math.round(amount * unitPrice * 100) / 100;
    return { unitPrice, cost };
  }

  if (rawCost !== undefined && rawCost !== null && !isNaN(rawCost)) {
    const costValue = rawCost;

    if (costValue === 0) {
      return { unitPrice: 0, cost: 0 };
    }

    const source = asset.source as string;
    if (source === 'government' || source === 'transfer') {
      if (costValue < 100 && amount > 100) {
        return { unitPrice: costValue, cost: Math.round(amount * costValue * 100) / 100 };
      }
    }

    if (costValue < 500 && amount >= 100) {
      return { unitPrice: costValue, cost: Math.round(amount * costValue * 100) / 100 };
    }

    if (amount > 0) {
      const derivedPrice = costValue / amount;
      if (derivedPrice < 1 && costValue > 100) {
        return { unitPrice: costValue, cost: Math.round(amount * costValue * 100) / 100 };
      }
      return { unitPrice: Math.round(derivedPrice * 100) / 100, cost: costValue };
    }

    return { unitPrice: costValue, cost: Math.round(amount * costValue * 100) / 100 };
  }

  return { unitPrice: 0, cost: 0 };
}

export const initializeData = (force = false): void => {
  if (!force && isInitialized()) {
    return;
  }

  const processedAssets: CarbonAsset[] = (assetsData as Array<Record<string, unknown>>).map((asset) => {
    const { unitPrice, cost } = migrateAssetUnitPrice(asset);
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
