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
  closingCost: number;
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

    const completedTrans = transactions.filter((t) => t.status === 'completed');

    for (const dept of depts) {
      const deptAssets = assets.filter((a) => a.department === dept.id);
      const deptTrans = completedTrans.filter((t) => t.department === dept.id);

      const buyTrans = deptTrans.filter((t) => t.type === 'buy');
      const assetOriginalAmounts: Record<string, number> = {};
      const assetOriginalCosts: Record<string, number> = {};
      const assetUnitPrices: Record<string, number> = {};

      for (const asset of deptAssets) {
        const relatedBuy = buyTrans.find((t) => t.assetId === asset.id);
        if (relatedBuy) {
          assetOriginalAmounts[asset.id] = relatedBuy.amount;
          assetOriginalCosts[asset.id] = relatedBuy.totalAmount || (relatedBuy.unitPrice || 0) * relatedBuy.amount;
          assetUnitPrices[asset.id] = relatedBuy.unitPrice || 0;
        } else {
          assetOriginalAmounts[asset.id] = asset.amount;
          assetOriginalCosts[asset.id] = asset.unitPrice * asset.amount;
          assetUnitPrices[asset.id] = asset.unitPrice;
        }
      }

      const deptAssetsBeforeYear = deptAssets.filter((a) => {
        const acquired = parseISO(a.acquiredDate);
        return acquired < yearStart;
      });

      const initialOpeningBalance = deptAssetsBeforeYear.reduce((sum, a) => {
        const originalAmount = assetOriginalAmounts[a.id] || a.amount;
        const assetReduceTrans = deptTrans.filter((t) => {
          if (t.type !== 'sell' && t.type !== 'performance') return false;
          if (t.assetId !== a.id) return false;
          const transDate = parseISO(t.transactionDate);
          return transDate < yearStart;
        });
        const usedBeforeYear = assetReduceTrans.reduce((s, t) => s + t.amount, 0);
        return sum + Math.max(0, originalAmount - usedBeforeYear);
      }, 0);

      const initialOpeningCost = deptAssetsBeforeYear.reduce((sum, a) => {
        const originalAmount = assetOriginalAmounts[a.id] || a.amount;
        const unitPrice = assetUnitPrices[a.id] || 0;
        const assetReduceTrans = deptTrans.filter((t) => {
          if (t.type !== 'sell' && t.type !== 'performance') return false;
          if (t.assetId !== a.id) return false;
          const transDate = parseISO(t.transactionDate);
          return transDate < yearStart;
        });
        const usedBeforeYear = assetReduceTrans.reduce((s, t) => s + t.amount, 0);
        const remainingAmount = Math.max(0, originalAmount - usedBeforeYear);
        return sum + Math.round(remainingAmount * unitPrice * 100) / 100;
      }, 0);

      for (let mi = 0; mi < months.length; mi++) {
        const monthDate = months[mi];
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'M月', { locale: zhCN });

        let openingBalance: number;
        let openingCost: number;

        if (mi === 0) {
          openingBalance = initialOpeningBalance;
          openingCost = initialOpeningCost;
        } else {
          const prevItem = inventoryItems[inventoryItems.length - 1];
          openingBalance = prevItem.closingBalance;
          openingCost = prevItem.closingCost;
        }

        const monthBuyTrans = deptTrans.filter((t) => {
          if (t.type !== 'buy') return false;
          const transDate = parseISO(t.transactionDate);
          return isWithinInterval(transDate, { start: monthStart, end: monthEnd });
        });

        const monthAdd = monthBuyTrans.reduce((sum, t) => sum + t.amount, 0);

        const monthAddCost = monthBuyTrans.reduce((sum, t) => {
          return sum + (t.totalAmount || (t.unitPrice || 0) * t.amount);
        }, 0);

        const monthNonBuyAssets = deptAssets.filter((a) => {
          if (assetOriginalAmounts[a.id] !== undefined) return false;
          const acquired = parseISO(a.acquiredDate);
          return isWithinInterval(acquired, { start: monthStart, end: monthEnd });
        });

        const monthNonBuyAdd = monthNonBuyAssets.reduce((sum, a) => sum + a.amount, 0);
        const monthNonBuyAddCost = monthNonBuyAssets.reduce((sum, a) => sum + a.cost, 0);

        const totalAdd = monthAdd + monthNonBuyAdd;
        const totalAddCost = monthAddCost + monthNonBuyAddCost;

        const monthSellTrans = deptTrans.filter((t) => {
          if (t.type !== 'sell') return false;
          const transDate = parseISO(t.transactionDate);
          return isWithinInterval(transDate, { start: monthStart, end: monthEnd });
        });

        const monthPerformanceTrans = deptTrans.filter((t) => {
          if (t.type !== 'performance') return false;
          const transDate = parseISO(t.transactionDate);
          return isWithinInterval(transDate, { start: monthStart, end: monthEnd });
        });

        const monthReduce = monthSellTrans.reduce((sum, t) => sum + t.amount, 0)
          + monthPerformanceTrans.reduce((sum, t) => sum + t.amount, 0);

        const monthSellCostCarry = monthSellTrans.reduce((sum, t) => {
          const asset = deptAssets.find((a) => a.id === t.assetId);
          const unitPrice = asset ? asset.unitPrice : (t.unitPrice || 0);
          return sum + Math.round(t.amount * unitPrice * 100) / 100;
        }, 0);

        const monthPerformanceCostCarry = monthPerformanceTrans.reduce((sum, t) => {
          const asset = deptAssets.find((a) => a.id === t.assetId);
          const unitPrice = asset ? asset.unitPrice : 0;
          return sum + Math.round(t.amount * unitPrice * 100) / 100;
        }, 0);

        const totalReduceCost = monthSellCostCarry + monthPerformanceCostCarry;

        const closingBalance = Math.max(0, openingBalance + totalAdd - monthReduce);
        const closingCost = Math.max(0, Math.round((openingCost + totalAddCost - totalReduceCost) * 100) / 100);

        const monthRevenue = monthSellTrans.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        const monthProfit = monthRevenue - monthSellCostCarry;

        inventoryItems.push({
          month: monthKey,
          monthLabel,
          department: dept.id,
          departmentName: dept.name,
          openingBalance,
          currentAdd: totalAdd,
          currentReduce: monthReduce,
          closingBalance,
          cost: totalAddCost,
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
