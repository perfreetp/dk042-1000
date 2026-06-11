export type AssetType = 'quota' | 'ccer' | 'other';
export type AssetStatus = 'available' | 'frozen' | 'used' | 'expired';
export type AssetSource = 'government' | 'purchase' | 'project' | 'transfer' | 'other';

export interface CarbonAsset {
  id: string;
  type: AssetType;
  name: string;
  amount: number;
  unit: string;
  source: AssetSource;
  status: AssetStatus;
  year: number;
  department: string;
  projectId?: string;
  cost: number;
  acquiredDate: string;
  expiryDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'buy' | 'sell' | 'performance' | 'freeze' | 'unfreeze';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  amount: number;
  unitPrice?: number;
  totalAmount?: number;
  counterparty?: string;
  department: string;
  projectId?: string;
  status: TransactionStatus;
  transactionDate: string;
  remark?: string;
  operator: string;
  createdAt: string;
}

export type ProjectStatus = 'planning' | 'ongoing' | 'completed' | 'suspended';

export interface ProjectMilestone {
  id: string;
  name: string;
  targetDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'delayed';
}

export interface ReductionProject {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  totalInvestment: number;
  estimatedReduction: number;
  actualReduction: number;
  estimatedRevenue: number;
  actualRevenue: number;
  progress: number;
  milestones: ProjectMilestone[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
}

export interface MonthlyReport {
  month: string;
  department: string;
  openingBalance: number;
  currentAdd: number;
  currentReduce: number;
  closingBalance: number;
  cost: number;
  revenue: number;
}

export interface PerformanceReport {
  year: number;
  department: string;
  emissionTarget: number;
  actualEmission: number;
  availableQuota: number;
  availableCCER: number;
  gap: number;
  suggestedAction: string;
}

export interface FilterParams {
  year?: number;
  type?: AssetType;
  status?: AssetStatus;
  source?: AssetSource;
  department?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalCost: number;
  totalRevenue: number;
  pendingPerformance: number;
  quotaBalance: number;
  ccerBalance: number;
  otherBalance: number;
  expiringSoon: number;
  activeProjects: number;
}

export const AssetTypeLabels: Record<AssetType, string> = {
  quota: '碳排放配额',
  ccer: 'CCER',
  other: '其他碳资产',
};

export const AssetStatusLabels: Record<AssetStatus, string> = {
  available: '可用',
  frozen: '冻结',
  used: '已使用',
  expired: '已过期',
};

export const AssetSourceLabels: Record<AssetSource, string> = {
  government: '政府分配',
  purchase: '外购',
  project: '项目产出',
  transfer: '内部划转',
  other: '其他',
};

export const TransactionTypeLabels: Record<TransactionType, string> = {
  buy: '买入',
  sell: '卖出',
  performance: '履约抵扣',
  freeze: '冻结',
  unfreeze: '解冻',
};

export const TransactionStatusLabels: Record<TransactionStatus, string> = {
  pending: '待处理',
  completed: '已完成',
  cancelled: '已取消',
};

export const ProjectStatusLabels: Record<ProjectStatus, string> = {
  planning: '规划中',
  ongoing: '进行中',
  completed: '已完成',
  suspended: '已暂停',
};
