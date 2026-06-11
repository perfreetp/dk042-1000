import { useState, useMemo, useRef } from 'react';
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Printer,
  Calendar,
  Building2,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useReports } from '@/hooks/useReports';
import { useAppStore } from '@/store';
import { exportMonthlyReportToExcel, exportPerformanceReportToExcel } from '@/utils/export';
import {
  formatNumber,
  formatCurrency,
  formatCarbon,
  formatPercentage,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FilterBar from '@/components/ui/FilterBar';
import Table from '@/components/ui/Table';
import type { Column } from '@/components/ui/Table';
import type { InventoryItem, PerformanceItem } from '@/hooks/useReports';

type ReportTab = 'inventory' | 'performance';

const gapLevelColors: Record<PerformanceItem['actionLevel'], string> = {
  excellent: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
  good: 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20',
  warning: 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20',
  danger: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20',
};

const gapLevelBadge: Record<PerformanceItem['actionLevel'], 'available' | 'active' | 'warning' | 'expired'> = {
  excellent: 'available',
  good: 'active',
  warning: 'warning',
  danger: 'expired',
};

export default function Reports() {
  const { departments } = useAppStore();
  const {
    filters,
    setFilters,
    inventoryData,
    performanceData,
    inventorySummary,
    performanceSummary,
    isLoading,
  } = useReports();
  const [activeTab, setActiveTab] = useState<ReportTab>('inventory');
  const printRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    label: `${currentYear - i} 年`,
    value: currentYear - i,
  }));

  const inventoryFilterConfig = [
    {
      key: 'year',
      label: '年度',
      type: 'select' as const,
      options: yearOptions,
    },
    {
      key: 'department',
      label: '部门',
      type: 'select' as const,
      options: departments.map((d) => ({ label: d.name, value: d.id })),
    },
  ];

  const performanceFilterConfig = [
    {
      key: 'year',
      label: '年度',
      type: 'select' as const,
      options: yearOptions,
    },
    {
      key: 'department',
      label: '部门',
      type: 'select' as const,
      options: departments.map((d) => ({ label: d.name, value: d.id })),
    },
  ];

  const handleInventoryFilter = (values: Record<string, string | number | [string, string] | null>) => {
    setFilters({
      ...filters,
      year: values.year ? Number(values.year) : undefined,
      department: (values.department as string) || undefined,
    });
  };

  const handlePerformanceFilter = (values: Record<string, string | number | [string, string] | null>) => {
    setFilters({
      ...filters,
      year: values.year ? Number(values.year) : undefined,
      department: (values.department as string) || undefined,
    });
  };

  const handleExportInventory = () => {
    exportMonthlyReportToExcel(inventoryData);
  };

  const handleExportPerformance = () => {
    const reportData = performanceData.map((item) => ({
      year: item.year,
      department: item.departmentName,
      emissionTarget: item.emissionTarget,
      actualEmission: item.actualEmission,
      availableQuota: item.availableQuota,
      availableCCER: item.availableCCER,
      gap: item.gap,
      suggestedAction: item.suggestedAction,
    }));
    exportPerformanceReportToExcel(reportData);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>碳资产报表 - ${activeTab === 'inventory' ? '月度盘点表' : '履约测算表'}</title>
          <style>
            body { font-family: 'Noto Sans SC', sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f3f4f6; font-weight: 600; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: 'monthLabel',
      title: '月份',
      width: '80px',
      render: (record) => (
        <div className="font-medium text-gray-900 dark:text-white">{record.monthLabel}</div>
      ),
    },
    {
      key: 'departmentName',
      title: '部门',
      render: (record) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{record.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'openingBalance',
      title: '期初余额',
      align: 'right',
      render: (record) => (
        <span className="font-medium">{formatCarbon(record.openingBalance, 0)}</span>
      ),
    },
    {
      key: 'currentAdd',
      title: '本期增加',
      align: 'right',
      render: (record) => (
        <span className="text-green-600 dark:text-green-400 font-medium">
          +{formatCarbon(record.currentAdd, 0)}
        </span>
      ),
    },
    {
      key: 'currentReduce',
      title: '本期减少',
      align: 'right',
      render: (record) => (
        <span className="text-red-600 dark:text-red-400 font-medium">
          -{formatCarbon(record.currentReduce, 0)}
        </span>
      ),
    },
    {
      key: 'closingBalance',
      title: '期末余额',
      align: 'right',
      render: (record) => (
        <span className="font-semibold text-primary-700 dark:text-primary-500">
          {formatCarbon(record.closingBalance, 0)}
        </span>
      ),
    },
    {
      key: 'cost',
      title: '成本',
      align: 'right',
      render: (record) => (
        <span className="text-orange-600 dark:text-orange-400">
          {formatCurrency(record.cost, 0)}
        </span>
      ),
    },
    {
      key: 'revenue',
      title: '收益',
      align: 'right',
      render: (record) => (
        <span className="text-green-600 dark:text-green-400">
          {formatCurrency(record.revenue, 0)}
        </span>
      ),
    },
    {
      key: 'profit',
      title: '利润',
      align: 'right',
      render: (record) => (
        <span
          className={cn(
            'font-medium',
            record.profit >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {record.profit >= 0 ? '+' : ''}
          {formatCurrency(record.profit, 0)}
        </span>
      ),
    },
  ];

  const performanceColumns: Column<PerformanceItem>[] = [
    {
      key: 'departmentName',
      title: '部门',
      render: (record) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">{record.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'emissionTarget',
      title: '排放目标',
      align: 'right',
      render: (record) => <span className="font-medium">{formatCarbon(record.emissionTarget, 0)}</span>,
    },
    {
      key: 'actualEmission',
      title: '实际排放',
      align: 'right',
      render: (record) => <span>{formatCarbon(record.actualEmission, 0)}</span>,
    },
    {
      key: 'availableQuota',
      title: '可用配额',
      align: 'right',
      render: (record) => (
        <span className="text-blue-600 dark:text-blue-400">{formatCarbon(record.availableQuota, 0)}</span>
      ),
    },
    {
      key: 'availableCCER',
      title: '可用CCER',
      align: 'right',
      render: (record) => (
        <span className="text-purple-600 dark:text-purple-400">{formatCarbon(record.availableCCER, 0)}</span>
      ),
    },
    {
      key: 'totalAvailable',
      title: '总计可用',
      align: 'right',
      render: (record) => (
        <span className="font-medium text-primary-700 dark:text-primary-500">
          {formatCarbon(record.totalAvailable, 0)}
        </span>
      ),
    },
    {
      key: 'gap',
      title: '履约缺口',
      align: 'right',
      render: (record) => (
        <div className="flex items-center justify-end gap-2">
          {record.gap > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          <span
            className={cn(
              'font-bold',
              record.gap > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            )}
          >
            {record.gap > 0 ? '+' : ''}
            {formatCarbon(record.gap, 0)}
          </span>
        </div>
      ),
    },
    {
      key: 'gapPercentage',
      title: '缺口比例',
      align: 'right',
      render: (record) => (
        <Badge status={gapLevelBadge[record.actionLevel]} dot>
          {formatPercentage(record.gapPercentage, 1)}
        </Badge>
      ),
    },
    {
      key: 'suggestedAction',
      title: '建议措施',
      width: '250px',
      render: (record) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">{record.suggestedAction}</span>
      ),
    },
  ];

  const inventoryChartOption = useMemo(() => {
    const months = [...new Set(inventoryData.map((item) => item.monthLabel))];
    const departments = [...new Set(inventoryData.map((item) => item.departmentName))];

    const series = departments.map((dept, index) => {
      const deptData = inventoryData.filter((item) => item.departmentName === dept);
      const colors = ['#15803d', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
      return {
        name: dept,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        itemStyle: { color: colors[index % colors.length] },
        data: months.map((month) => {
          const item = deptData.find((d) => d.monthLabel === month);
          return item ? item.closingBalance : 0;
        }),
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${formatCarbon(param.value, 0)}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: departments,
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        name: '吨CO₂e',
        axisLabel: {
          formatter: (value: number) => formatNumber(value, 0),
        },
      },
      series,
    };
  }, [inventoryData]);

  const performanceChartOption = useMemo(() => {
    const departments = performanceData.map((item) => item.departmentName);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${formatCarbon(param.value, 0)}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['排放目标', '实际排放', '可用配额', '可用CCER', '履约缺口'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: departments,
        axisLabel: { fontSize: 12, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: '吨CO₂e',
        axisLabel: {
          formatter: (value: number) => formatNumber(value, 0),
        },
      },
      series: [
        {
          name: '排放目标',
          type: 'bar',
          itemStyle: { color: '#94a3b8' },
          data: performanceData.map((item) => item.emissionTarget),
        },
        {
          name: '实际排放',
          type: 'bar',
          itemStyle: { color: '#f97316' },
          data: performanceData.map((item) => item.actualEmission),
        },
        {
          name: '可用配额',
          type: 'bar',
          itemStyle: { color: '#3b82f6' },
          data: performanceData.map((item) => item.availableQuota),
        },
        {
          name: '可用CCER',
          type: 'bar',
          itemStyle: { color: '#8b5cf6' },
          data: performanceData.map((item) => item.availableCCER),
        },
        {
          name: '履约缺口',
          type: 'bar',
          itemStyle: { color: '#ef4444' },
          data: performanceData.map((item) => item.gap),
        },
      ],
    };
  }, [performanceData]);

  const profitTrendChartOption = useMemo(() => {
    const months = [...new Set(inventoryData.map((item) => item.monthLabel))];
    const departments = [...new Set(inventoryData.map((item) => item.departmentName))];

    const series = departments.map((dept, index) => {
      const deptData = inventoryData.filter((item) => item.departmentName === dept);
      const colors = ['#15803d', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
      return {
        name: dept,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: colors[index % colors.length] },
        lineStyle: { width: 2 },
        data: months.map((month) => {
          const item = deptData.find((d) => d.monthLabel === month);
          return item ? item.profit : 0;
        }),
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            const value = param.value;
            const icon = value >= 0 ? '📈' : '📉';
            result += `${icon} ${param.seriesName}: ${formatCurrency(value, 0)}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: departments,
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        name: '元',
        axisLabel: {
          formatter: (value: number) => formatNumber(value, 0),
        },
      },
      series,
    };
  }, [inventoryData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">报表中心</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            查看和导出碳资产相关的各类统计报表
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            打印
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={activeTab === 'inventory' ? handleExportInventory : handleExportPerformance}
          >
            导出 Excel
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'inventory'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <FileText className="w-4 h-4" />
          月度盘点表
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'performance'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          履约测算表
        </button>
      </div>

      <div ref={printRef}>
        {activeTab === 'inventory' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <FilterBar
                  filters={inventoryFilterConfig}
                  onFilter={handleInventoryFilter}
                  showAdvanced={false}
                  initialValues={{
                    year: filters.year || currentYear,
                    department: filters.department || '',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card padding="sm" className="bg-gradient-to-br from-primary-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总期初余额</div>
                <div className="text-xl font-bold text-primary-700 dark:text-primary-500">
                  {formatCarbon(inventorySummary.totalOpening, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-green-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总增加量</div>
                <div className="flex items-center gap-1 text-xl font-bold text-green-700 dark:text-green-500">
                  <TrendingUp className="w-5 h-5" />
                  {formatCarbon(inventorySummary.totalAdd, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-red-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总减少量</div>
                <div className="flex items-center gap-1 text-xl font-bold text-red-700 dark:text-red-500">
                  <TrendingDown className="w-5 h-5" />
                  {formatCarbon(inventorySummary.totalReduce, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-blue-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总期末余额</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-500">
                  {formatCarbon(inventorySummary.totalClosing, 0)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card padding="sm" className="bg-gradient-to-br from-orange-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总成本</div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-500">
                  {formatCurrency(inventorySummary.totalCost, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-emerald-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总收益</div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-500">
                  {formatCurrency(inventorySummary.totalRevenue, 0)}
                </div>
              </Card>
              <Card
                padding="sm"
                className={cn(
                  inventorySummary.totalProfit >= 0
                    ? 'bg-gradient-to-br from-green-50 to-white'
                    : 'bg-gradient-to-br from-red-50 to-white'
                )}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总利润</div>
                <div
                  className={cn(
                    'text-xl font-bold',
                    inventorySummary.totalProfit >= 0
                      ? 'text-green-700 dark:text-green-500'
                      : 'text-red-700 dark:text-red-500'
                  )}
                >
                  {inventorySummary.totalProfit >= 0 ? '+' : ''}
                  {formatCurrency(inventorySummary.totalProfit, 0)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  期末余额趋势
                </h3>
                <div className="h-80">
                  <ReactECharts
                    option={inventoryChartOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  利润趋势
                </h3>
                <div className="h-80">
                  <ReactECharts
                    option={profitTrendChartOption}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                  />
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  月度盘点明细
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {filters.year || currentYear} 年度
                </div>
              </div>
              <Table
                columns={inventoryColumns}
                data={inventoryData}
                rowKey={(record) => `${record.month}-${record.department}`}
                loading={isLoading}
                pagination={{ pageSize: 12, showTotal: true }}
              />
              {inventoryData.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-6 gap-4 text-sm">
                    <div className="col-span-2 font-semibold text-gray-900 dark:text-white">
                      年度合计
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">期初: </span>
                      <span className="font-medium">{formatCarbon(inventorySummary.totalOpening, 0)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">增加: </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        +{formatCarbon(inventorySummary.totalAdd, 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">减少: </span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{formatCarbon(inventorySummary.totalReduce, 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">期末: </span>
                      <span className="font-bold text-primary-700 dark:text-primary-500">
                        {formatCarbon(inventorySummary.totalClosing, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">总成本: </span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {formatCurrency(inventorySummary.totalCost, 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">总收益: </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(inventorySummary.totalRevenue, 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">总利润: </span>
                      <span
                        className={cn(
                          'font-bold',
                          inventorySummary.totalProfit >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {inventorySummary.totalProfit >= 0 ? '+' : ''}
                        {formatCurrency(inventorySummary.totalProfit, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <FilterBar
                  filters={performanceFilterConfig}
                  onFilter={handlePerformanceFilter}
                  showAdvanced={false}
                  initialValues={{
                    year: filters.year || currentYear,
                    department: filters.department || '',
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card padding="sm" className="bg-gradient-to-br from-gray-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总排放目标</div>
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {formatCarbon(performanceSummary.totalTarget, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-orange-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总实际排放</div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-500">
                  {formatCarbon(performanceSummary.totalActual, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-primary-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总可用配额</div>
                <div className="text-xl font-bold text-primary-700 dark:text-primary-500">
                  {formatCarbon(performanceSummary.totalAvailableQuota, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-purple-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总可用CCER</div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-500">
                  {formatCarbon(performanceSummary.totalAvailableCCER, 0)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card
                padding="sm"
                className={cn(
                  performanceSummary.totalGap > 0
                    ? 'bg-gradient-to-br from-red-50 to-white'
                    : 'bg-gradient-to-br from-green-50 to-white'
                )}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">总履约缺口</div>
                <div className="flex items-center gap-2">
                  {performanceSummary.totalGap > 0 ? (
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  <span
                    className={cn(
                      'text-xl font-bold',
                      performanceSummary.totalGap > 0
                        ? 'text-red-700 dark:text-red-500'
                        : 'text-green-700 dark:text-green-500'
                    )}
                  >
                    {performanceSummary.totalGap > 0 ? '+' : ''}
                    {formatCarbon(performanceSummary.totalGap, 0)}
                  </span>
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-blue-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">履约完成率</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full progress-bar"
                      style={{ width: `${Math.min(performanceSummary.completionRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-500">
                    {formatPercentage(performanceSummary.completionRate, 1)}
                  </span>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                履约情况对比
              </h3>
              <div className="h-96">
                <ReactECharts
                  option={performanceChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  履约测算明细
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {filters.year || currentYear} 年度
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      {performanceColumns.map((column) => (
                        <th
                          key={String(column.key)}
                          style={{ width: column.width }}
                          className={cn(
                            'px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider',
                            column.align === 'right' ? 'text-right' : 'text-left'
                          )}
                        >
                          {column.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {performanceData.map((record, index) => (
                      <tr
                        key={`${record.year}-${record.department}`}
                        className={cn(
                          'transition-all duration-200 hover:shadow-sm',
                          gapLevelColors[record.actionLevel],
                          index % 2 === 1 && 'bg-white/50 dark:bg-gray-800/50'
                        )}
                      >
                        {performanceColumns.map((column) => (
                          <td
                            key={String(column.key)}
                            className={cn(
                              'px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300',
                              column.align === 'right' ? 'text-right' : 'text-left'
                            )}
                          >
                            {column.render ? column.render(record, index) : String(record[column.key as keyof PerformanceItem] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {performanceData.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="font-semibold text-gray-900 dark:text-white">合计</div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">目标: </span>
                      <span className="font-medium">{formatCarbon(performanceSummary.totalTarget, 0)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">实际: </span>
                      <span className="font-medium">{formatCarbon(performanceSummary.totalActual, 0)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">可用配额: </span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {formatCarbon(performanceSummary.totalAvailableQuota, 0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">可用CCER: </span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {formatCarbon(performanceSummary.totalAvailableCCER, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div className="text-right">
                      <span className="text-gray-500 dark:text-gray-400">总缺口: </span>
                      <span
                        className={cn(
                          'font-bold',
                          performanceSummary.totalGap > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        )}
                      >
                        {performanceSummary.totalGap > 0 ? '+' : ''}
                        {formatCarbon(performanceSummary.totalGap, 0)}
                      </span>
                    </div>
                    <div className="text-right col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">履约完成率: </span>
                      <span className="font-bold text-primary-700 dark:text-primary-500">
                        {formatPercentage(performanceSummary.completionRate, 1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                风险等级说明
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-400">优秀</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    资产充裕，可考虑出售多余配额
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800 dark:text-blue-400">良好</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    资产充足，可正常履约
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-400">警告</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    缺口较小，建议购入少量配额
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800 dark:text-red-400">危险</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    缺口较大，需立即制定减排计划
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
