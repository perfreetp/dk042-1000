import { useMemo } from 'react';
import { useAppStore } from '@/store';
import type { DashboardStats, CarbonAsset, Transaction } from '@/types';
import { parseISO, differenceInDays, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface AssetDistribution {
  type: 'quota' | 'ccer' | 'other';
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  monthLabel: string;
  balance: number;
  cost: number;
  revenue: number;
}

export interface ExpiringAsset {
  id: string;
  name: string;
  type: string;
  amount: number;
  expiryDate: string;
  daysLeft: number;
  status: 'warning' | 'danger';
}

export interface PerformanceReminder {
  id: string;
  assetName: string;
  assetType: string;
  amount: number;
  transactionDate: string;
  status: string;
}

export interface UseDashboardReturn {
  stats: DashboardStats;
  assetDistribution: AssetDistribution[];
  monthlyTrends: MonthlyTrend[];
  expiringAssets: ExpiringAsset[];
  performanceReminders: PerformanceReminder[];
  activeProjectsCount: number;
  isLoading: boolean;
}

const ASSET_COLORS: Record<string, string> = {
  quota: '#15803d',
  ccer: '#0d9488',
  other: '#f59e0b',
};

const ASSET_NAMES: Record<string, string> = {
  quota: '碳排放配额',
  ccer: 'CCER',
  other: '其他碳资产',
};

export function useDashboard(): UseDashboardReturn {
  const { assets, transactions, projects, loading } = useAppStore();

  const stats = useMemo<DashboardStats>(() => {
    const availableAssets = assets.filter((a) => a.status === 'available');
    const frozenAssets = assets.filter((a) => a.status === 'frozen');
    const activeAssets = [...availableAssets, ...frozenAssets];

    const totalBalance = activeAssets.reduce((sum, a) => sum + a.amount, 0);
    const totalCost = activeAssets.reduce((sum, a) => sum + a.cost, 0);

    const completedSellTransactions = transactions.filter(
      (t) => t.type === 'sell' && t.status === 'completed'
    );
    const totalRevenue = completedSellTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const pendingPerformance = transactions
      .filter((t) => t.type === 'performance' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const quotaBalance = activeAssets.filter((a) => a.type === 'quota').reduce((sum, a) => sum + a.amount, 0);
    const ccerBalance = activeAssets.filter((a) => a.type === 'ccer').reduce((sum, a) => sum + a.amount, 0);
    const otherBalance = activeAssets.filter((a) => a.type === 'other').reduce((sum, a) => sum + a.amount, 0);

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = activeAssets.filter((a) => {
      if (!a.expiryDate) return false;
      const expiry = parseISO(a.expiryDate);
      return expiry >= now && expiry <= thirtyDaysLater;
    }).reduce((sum, a) => sum + a.amount, 0);

    const activeProjects = projects.filter((p) => p.status === 'ongoing').length;

    return {
      totalBalance,
      totalCost,
      totalRevenue,
      pendingPerformance,
      quotaBalance,
      ccerBalance,
      otherBalance,
      expiringSoon,
      activeProjects,
    };
  }, [assets, transactions, projects]);

  const assetDistribution = useMemo<AssetDistribution[]>(() => {
    const availableAssets = assets.filter((a) => a.status === 'available' || a.status === 'frozen');
    const total = availableAssets.reduce((sum, a) => sum + a.amount, 0);

    const types: Array<'quota' | 'ccer' | 'other'> = ['quota', 'ccer', 'other'];
    return types.map((type) => {
      const value = availableAssets.filter((a) => a.type === type).reduce((sum, a) => sum + a.amount, 0);
      return {
        type,
        name: ASSET_NAMES[type],
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: ASSET_COLORS[type],
      };
    });
  }, [assets]);

  const monthlyTrends = useMemo<MonthlyTrend[]>(() => {
    const now = new Date();
    const months: MonthlyTrend[] = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);
      const monthKey = format(targetDate, 'yyyy-MM');
      const monthLabel = format(targetDate, 'M月', { locale: zhCN });

      const monthAssets = assets.filter((a) => {
        const acquired = parseISO(a.acquiredDate);
        return isWithinInterval(acquired, { start: monthStart, end: monthEnd });
      });

      const monthTransactions = transactions.filter((t) => {
        const transDate = parseISO(t.transactionDate);
        return isWithinInterval(transDate, { start: monthStart, end: monthEnd }) && t.status === 'completed';
      });

      const balance = monthAssets.reduce((sum, a) => sum + a.amount, 0);
      const cost = monthAssets.reduce((sum, a) => sum + a.cost, 0);
      const revenue = monthTransactions
        .filter((t) => t.type === 'sell')
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      months.push({
        month: monthKey,
        monthLabel,
        balance,
        cost,
        revenue,
      });
    }

    return months;
  }, [assets, transactions]);

  const expiringAssets = useMemo<ExpiringAsset[]>(() => {
    const now = new Date();
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return assets
      .filter((a): a is CarbonAsset & { expiryDate: string } => {
        if (!a.expiryDate || a.status === 'used' || a.status === 'expired') return false;
        const expiry = parseISO(a.expiryDate);
        return expiry >= now && expiry <= ninetyDaysLater;
      })
      .map((a) => {
        const daysLeft = differenceInDays(parseISO(a.expiryDate), now);
        return {
          id: a.id,
          name: a.name,
          type: ASSET_NAMES[a.type] || a.type,
          amount: a.amount,
          expiryDate: a.expiryDate,
          daysLeft,
          status: (daysLeft <= 30 ? 'danger' : 'warning') as 'warning' | 'danger',
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 10);
  }, [assets]);

  const performanceReminders = useMemo<PerformanceReminder[]>(() => {
    return transactions
      .filter((t): t is Transaction & { status: 'pending' } => t.type === 'performance' && t.status === 'pending')
      .map((t) => ({
        id: t.id,
        assetName: t.assetName,
        assetType: ASSET_NAMES[t.assetType] || t.assetType,
        amount: t.amount,
        transactionDate: t.transactionDate,
        status: t.status,
      }))
      .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
      .slice(0, 5);
  }, [transactions]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter((p) => p.status === 'ongoing').length;
  }, [projects]);

  return {
    stats,
    assetDistribution,
    monthlyTrends,
    expiringAssets,
    performanceReminders,
    activeProjectsCount,
    isLoading: loading,
  };
}
