import { format, differenceInDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type {
  AssetType,
  AssetStatus,
  AssetSource,
  TransactionType,
  TransactionStatus,
  ProjectStatus,
} from '@/types';
import {
  AssetTypeLabels,
  AssetStatusLabels,
  AssetSourceLabels,
  TransactionTypeLabels,
  TransactionStatusLabels,
  ProjectStatusLabels,
} from '@/types';

export const formatDate = (date: string | Date, fmt: string = 'yyyy-MM-dd'): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (amount: number, decimals: number = 2): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  return `¥${formatNumber(amount, decimals)}`;
};

export const formatCarbon = (amount: number, decimals: number = 2): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  return `${formatNumber(amount, decimals)} tCO₂e`;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${formatNumber(value, decimals)}%`;
};

export const getDaysUntil = (date: string): number => {
  if (!date) return 0;
  return differenceInDays(parseISO(date), new Date());
};

export const getExpiryStatus = (expiryDate?: string): { days: number; status: 'normal' | 'warning' | 'danger' } => {
  if (!expiryDate) return { days: 0, status: 'normal' };
  const days = getDaysUntil(expiryDate);
  if (days <= 0) return { days, status: 'danger' };
  if (days <= 30) return { days, status: 'warning' };
  return { days, status: 'normal' };
};

export const getAssetTypeLabel = (type: AssetType): string => {
  return AssetTypeLabels[type] || type;
};

export const getAssetStatusLabel = (status: AssetStatus): string => {
  return AssetStatusLabels[status] || status;
};

export const getAssetSourceLabel = (source: AssetSource): string => {
  return AssetSourceLabels[source] || source;
};

export const getTransactionTypeLabel = (type: TransactionType): string => {
  return TransactionTypeLabels[type] || type;
};

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  return TransactionStatusLabels[status] || status;
};

export const getProjectStatusLabel = (status: ProjectStatus): string => {
  return ProjectStatusLabels[status] || status;
};

export const getStatusColorClass = (status: string): string => {
  const colorMap: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    frozen: 'bg-yellow-100 text-yellow-800',
    used: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    planning: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-primary-100 text-primary-800',
    suspended: 'bg-orange-100 text-orange-800',
    buy: 'bg-green-100 text-green-800',
    sell: 'bg-red-100 text-red-800',
    performance: 'bg-blue-100 text-blue-800',
    freeze: 'bg-yellow-100 text-yellow-800',
    unfreeze: 'bg-cyan-100 text-cyan-800',
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    delayed: 'bg-red-100 text-red-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getTrendIcon = (value: number): { icon: 'up' | 'down' | 'equal'; color: string } => {
  if (value > 0) return { icon: 'up', color: 'text-green-600' };
  if (value < 0) return { icon: 'down', color: 'text-red-600' };
  return { icon: 'equal', color: 'text-gray-600' };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
