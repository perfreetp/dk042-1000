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

  setAssets(assetsData as CarbonAsset[]);
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
