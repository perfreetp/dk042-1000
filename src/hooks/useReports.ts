import { useMemo, useState } from 'react';
import { useAppStore } from '@/store';
import type { MonthlyReport, PerformanceReport, FilterParams, CarbonAsset } from '@/types';
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface ReportFilters {
  department?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
}

export interface InventoryItem {
  month: string;
  monthLabel: string;
  department: string;
  departmentName: string;
  openingBalance: number;
  currentAdd: number;
  currentReduce: number;
  closingBalance: number;
  cost: number;
  revenue: number;
  profit: number;
}

export interface PerformanceItem {
  year: number;
  department: string;
  departmentName: string;
  emissionTarget: number;
  actualEmission: number;
  availableQuota: number;
  availableCCER: number;
  totalAvailable: number;
  gap: number;
  gapPercentage: number;
  suggestedAction: string;
  actionLevel: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface UseReportsReturn {
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  inventoryData: InventoryItem[];
  performanceData: PerformanceItem[];
  inventorySummary: {
    totalOpening: number;
    totalAdd: number;
    totalReduce: number;
    totalClosing: number;
    totalCost: number;
    totalRevenue: number;
    totalProfit: number;
  };
  performanceSummary: {
    totalTarget: number;
    totalActual: number;
    totalAvailableQuota: number;
    totalAvailableCCER: number;
    totalGap: number;
    completionRate: number;
  };
  isLoading: boolean;
}

function getSuggestedAction(gap: number, gapPercentage: number): { action: string; level: 'excellent' | 'good' | 'warning' | 'danger' } {
  if (gap <= 0) {
    if (gapPercentage < -10) {
      return { action: '资产充裕，可考虑出售多余配额或用于CCER抵消', level: 'excellent' };
    }
    return { action: '资产充足，可正常履约', level: 'good' };
  }
  if (gapPercentage <= 10) {
    return { action: '缺口较小，建议购入少量配额或CCER补充', level: 'warning' };
  }
  if (gapPercentage <= 30) {
    return { action: '缺口较大，需立即制定减排计划并购入资产', level: 'danger' };
  }
  return { action: '缺口严重，建议启动紧急减排方案，同时大规模购入配额', level: 'danger' };
}

export function useReports(): UseReportsReturn {
  const { assets, transactions, departments, loading } = useAppStore();
  const [filters, setFilters] = useState<ReportFilters>({});

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (filters.department) {
      result = result.filter((a) => a.department === filters.department);
    }
    if (filters.startDate) {
      result = result.filter((a) => a.acquiredDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((a) => a.acquiredDate <= filters.endDate!);
    }

    return result;
  }, [assets, filters]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (filters.department) {
      result = result.filter((t) => t.department === filters.department);
    }
    if (filters.startDate) {
      result = result.filter((t) => t.transactionDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((t) => t.transactionDate <= filters.endDate!);
    }

    return result;
  }, [transactions, filters]);

  const inventoryData = useMemo<InventoryItem[]>(() => {
    const now = new Date();
    const currentYear = filters.year || now.getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    const depts = filters.department
      ? departments.filter((d) => d.id === filters.department)
      : departments;

    const inventoryItems: InventoryItem[] = [];

    for (const dept of depts) {
      const deptAllAssets = assets.filter((a) => a.department === dept.id);
      const deptAllTrans = transactions.filter((t) => t.department === dept.id && t.status === 'completed');

      const deptAssetsBeforeYear = deptAllAssets.filter((a) => {
        const acquired = parseISO(a.acquiredDate);
        return acquired < yearStart;
      });

      const initialOpeningBalance = deptAssetsBeforeYear.reduce((sum, a) => {
        const assetTrans = deptAllTrans.filter((t) => {
          if (t.type !== 'sell' && t.type !== 'performance') return false;
          if (t.assetId !== a.id) return false;
          const transDate = parseISO(t.transactionDate);
          return transDate < yearStart;
        });
        const usedBeforeYear = assetTrans.reduce((s, t) => s + t.amount, 0);
        return sum + Math.max(0, a.amount - usedBeforeYear);
      }, 0);

      for (const monthDate of months) {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'M月', { locale: zhCN });

        const isFirstMonth = monthDate.getMonth() === 0;
        let openingBalance: number;
        let cumulativeCost = 0;

        if (isFirstMonth) {
          openingBalance = initialOpeningBalance;
        } else {
          const prevMonthKey = format(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1), 'yyyy-MM');
          const prevItem = inventoryItems.find(
            (item) => item.department === dept.id && item.month === prevMonthKey
          );
          openingBalance = prevItem ? prevItem.closingBalance : 0;
        }

        const monthAddAssets = deptAllAssets.filter((a) => {
          const acquired = parseISO(a.acquiredDate);
          return isWithinInterval(acquired, { start: monthStart, end: monthEnd });
        });

        const monthReduceTrans = deptAllTrans.filter((t) => {
          if (t.type !== 'sell' && t.type !== 'performance') return false;
          const transDate = parseISO(t.transactionDate);
          return isWithinInterval(transDate, { start: monthStart, end: monthEnd });
        });

        const monthAdd = monthAddAssets.reduce((sum, a) => {
          return sum + a.amount;
        }, 0);

        const monthReduce = monthReduceTrans.reduce((sum, t) => {
          return sum + t.amount;
        }, 0);

        const closingBalance = Math.max(0, openingBalance + monthAdd - monthReduce);

        const monthCost = monthAddAssets.reduce((sum, a) => {
          const assetReduceThisMonth = monthReduceTrans
            .filter((t) => t.assetId === a.id)
            .reduce((s, t) => s + t.amount, 0);
          const remainingRatio = a.amount > 0 ? (a.amount - assetReduceThisMonth) / a.amount : 0;
          const addCost = a.cost * (remainingRatio > 0 ? 1 : 0);
          return sum + addCost;
        }, 0);

        const monthRevenue = monthReduceTrans
          .filter((t) => t.type === 'sell')
          .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        const monthProfit = monthRevenue - monthCost;

        inventoryItems.push({
          month: monthKey,
          monthLabel,
          department: dept.id,
          departmentName: dept.name,
          openingBalance,
          currentAdd: monthAdd,
          currentReduce: monthReduce,
          closingBalance,
          cost: monthCost,
          revenue: monthRevenue,
          profit: monthProfit,
        });
      }
    }

    return inventoryItems;
  }, [assets, transactions, departments, filters.department, filters.year]);

  const inventorySummary = useMemo(() => {
    const deptSet = new Set(inventoryData.map((item) => item.department));
    let totalOpening = 0;
    let totalAdd = 0;
    let totalReduce = 0;
    let totalClosing = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const dept of deptSet) {
      const deptItems = inventoryData.filter((item) => item.department === dept);
      if (deptItems.length === 0) continue;

      deptItems.sort((a, b) => a.month.localeCompare(b.month));

      totalOpening += deptItems[0].openingBalance;

      totalClosing += deptItems[deptItems.length - 1].closingBalance;

      totalAdd += deptItems.reduce((s, i) => s + i.currentAdd, 0);
      totalReduce += deptItems.reduce((s, i) => s + i.currentReduce, 0);
      totalCost += deptItems.reduce((s, i) => s + i.cost, 0);
      totalRevenue += deptItems.reduce((s, i) => s + i.revenue, 0);
      totalProfit += deptItems.reduce((s, i) => s + i.profit, 0);
    }

    return {
      totalOpening,
      totalAdd,
      totalReduce,
      totalClosing,
      totalCost,
      totalRevenue,
      totalProfit,
    };
  }, [inventoryData]);

  const performanceData = useMemo<PerformanceItem[]>(() => {
    const now = new Date();
    const targetYear = filters.year || now.getFullYear();

    const depts = filters.department
      ? departments.filter((d) => d.id === filters.department)
      : departments;

    return depts.map((dept) => {
      const deptAssets = filteredAssets.filter(
        (a) => a.department === dept.id && a.year === targetYear && a.status !== 'expired'
      );
      const deptTrans = filteredTransactions.filter(
        (t) => t.department === dept.id && parseISO(t.transactionDate).getFullYear() === targetYear
      );

      const completedPerformance = deptTrans.filter(
        (t) => t.type === 'performance' && t.status === 'completed'
      );
      const actualEmission = completedPerformance.reduce((sum, t) => sum + t.amount, 0);

      const emissionFactor = 1.2;
      const emissionTarget = actualEmission > 0 
        ? actualEmission * emissionFactor 
        : 50000;

      const availableAssets = deptAssets.filter((a) => a.status === 'available' || a.status === 'frozen');
      const availableQuota = availableAssets
        .filter((a) => a.type === 'quota')
        .reduce((sum, a) => sum + a.amount, 0);
      const availableCCER = availableAssets
        .filter((a) => a.type === 'ccer')
        .reduce((sum, a) => sum + a.amount, 0);
      const totalAvailable = availableQuota + availableCCER;

      const gap = Math.max(0, emissionTarget - totalAvailable);
      const gapPercentage = emissionTarget > 0 ? (gap / emissionTarget) * 100 : 0;

      const { action, level } = getSuggestedAction(gap, gapPercentage);

      return {
        year: targetYear,
        department: dept.id,
        departmentName: dept.name,
        emissionTarget,
        actualEmission,
        availableQuota,
        availableCCER,
        totalAvailable,
        gap,
        gapPercentage,
        suggestedAction: action,
        actionLevel: level,
      };
    });
  }, [filteredAssets, filteredTransactions, departments, filters.department, filters.year]);

  const performanceSummary = useMemo(() => {
    const totalTarget = performanceData.reduce((sum, item) => sum + item.emissionTarget, 0);
    const totalActual = performanceData.reduce((sum, item) => sum + item.actualEmission, 0);
    const totalAvailableQuota = performanceData.reduce((sum, item) => sum + item.availableQuota, 0);
    const totalAvailableCCER = performanceData.reduce((sum, item) => sum + item.availableCCER, 0);
    const totalGap = performanceData.reduce((sum, item) => sum + item.gap, 0);
    const completionRate = totalTarget > 0 ? ((totalTarget - totalGap) / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalActual,
      totalAvailableQuota,
      totalAvailableCCER,
      totalGap,
      completionRate,
    };
  }, [performanceData]);

  return {
    filters,
    setFilters,
    inventoryData,
    performanceData,
    inventorySummary,
    performanceSummary,
    isLoading: loading,
  };
}
