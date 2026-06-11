import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Plus,
  ArrowUpRight,
  Download,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAppStore } from '@/store';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import { formatCurrency, formatCarbon, formatDate } from '@/utils/format';
import { exportDashboardToPDF } from '@/utils/export';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Dashboard() {
  const {
    stats,
    assetDistribution,
    monthlyTrends,
    expiringAssets,
    performanceReminders,
    isLoading,
  } = useDashboard();

  const { departments } = useAppStore();
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = () => {
    setExporting(true);
    try {
      const pdfData = [
        { label: '可用余额', value: formatCarbon(stats.totalBalance) },
        { label: '总成本', value: formatCurrency(stats.totalCost) },
        { label: '总收益', value: formatCurrency(stats.totalRevenue) },
        { label: '待履约量', value: formatCarbon(stats.pendingPerformance) },
        { label: '碳排放配额余额', value: formatCarbon(stats.quotaBalance) },
        { label: 'CCER余额', value: formatCarbon(stats.ccerBalance) },
        { label: '其他碳资产余额', value: formatCarbon(stats.otherBalance) },
        { label: '即将到期', value: formatCarbon(stats.expiringSoon) },
        { label: '进行中项目', value: `${stats.activeProjects} 个` },
      ];
      exportDashboardToPDF(pdfData);
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  const getDepartmentName = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    return dept?.name || id;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: '可用余额',
      value: stats.totalBalance,
      prefix: '',
      suffix: ' tCO₂e',
      icon: <Wallet className="w-6 h-6" />,
      color: 'bg-primary-600',
      trend: 12.5,
      trendLabel: '较上月',
      formatter: (v: number) => v.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
    },
    {
      title: '总成本',
      value: stats.totalCost,
      prefix: '¥',
      suffix: '',
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'bg-red-500',
      trend: -3.2,
      trendLabel: '较上月',
      formatter: (v: number) => v.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
    },
    {
      title: '总收益',
      value: stats.totalRevenue,
      prefix: '¥',
      suffix: '',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-accent-cyan',
      trend: 8.7,
      trendLabel: '较上月',
      formatter: (v: number) => v.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
    },
    {
      title: '待履约量',
      value: stats.pendingPerformance,
      prefix: '',
      suffix: ' tCO₂e',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-accent-amber',
      formatter: (v: number) => v.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
    },
  ];

  const quickActions = [
    { title: '登记买入', icon: <Plus className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
    { title: '登记卖出', icon: <ArrowUpRight className="w-5 h-5" />, color: 'text-red-600 bg-red-50' },
    { title: '履约抵扣', icon: <CheckCircle className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { title: '资产报告', icon: <FileText className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">总览</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            碳资产整体概览和关键指标
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Download className="w-4 h-4" />}
          loading={exporting}
          onClick={handleExportPDF}
        >
          导出PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary-600" />
              资产类型分布
            </h3>
          </div>
          <PieChart
            data={assetDistribution.map((d) => ({
              name: d.name,
              value: d.value,
              color: d.color,
            }))}
            donut={true}
            showLabel={false}
            height={280}
          />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              月度趋势
            </h3>
          </div>
          <LineChart
            xAxisData={monthlyTrends.map((t) => t.monthLabel)}
            series={[
              {
                name: '余额',
                data: monthlyTrends.map((t) => t.balance),
                color: '#15803d',
                areaStyle: true,
              },
              {
                name: '成本',
                data: monthlyTrends.map((t) => t.cost),
                color: '#dc2626',
              },
              {
                name: '收益',
                data: monthlyTrends.map((t) => t.revenue),
                color: '#0d9488',
              },
            ]}
            height={280}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-amber" />
              到期提醒
              {expiringAssets.length > 0 && (
                <Badge status="warning" dot>
                  {expiringAssets.length} 项
                </Badge>
              )}
            </h3>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {expiringAssets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p>暂无即将到期的资产</p>
              </div>
            ) : (
              expiringAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    'border border-gray-100 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        asset.status === 'danger'
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      )}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {asset.type} · {formatCarbon(asset.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge status={asset.status === 'danger' ? 'expired' : 'warning'}>
                      {asset.daysLeft} 天后到期
                    </Badge>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(asset.expiryDate)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              快捷操作
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl',
                  'border border-gray-200 dark:border-gray-700',
                  'hover:border-primary-300 dark:hover:border-primary-600',
                  'hover:shadow-md transition-all duration-200',
                  'group'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
                    'transition-transform duration-200 group-hover:scale-110',
                    action.color
                  )}
                >
                  {action.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.title}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              待处理履约
            </h4>
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {performanceReminders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  暂无待处理履约
                </p>
              ) : (
                performanceReminders.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.assetName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.assetType} · {getDepartmentName(item.assetType)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCarbon(item.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.transactionDate)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
