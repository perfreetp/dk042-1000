import { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Snowflake,
  Sun,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type {
  Transaction,
  FilterParams,
  TransactionType,
  TransactionStatus,
  CarbonAsset,
} from '@/types';
import {
  TransactionTypeLabels,
  TransactionStatusLabels,
  AssetTypeLabels,
} from '@/types';
import Button from '@/components/ui/Button';
import FilterBar from '@/components/ui/FilterBar';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  formatCarbon,
  formatCurrency,
  formatDate,
  formatDateTime,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  getAssetTypeLabel,
} from '@/utils/format';
import { exportTransactionsToExcel } from '@/utils/export';
import { cn } from '@/lib/utils';

type TransactionModalType = 'buy' | 'sell' | 'performance' | 'freeze' | 'unfreeze' | null;

interface TransactionFormData {
  assetId: string;
  assetName: string;
  assetType: string;
  amount: number;
  unitPrice: number;
  totalAmount: number;
  counterparty: string;
  department: string;
  projectId: string;
  transactionDate: string;
  operator: string;
  remark: string;
}

const initialFormData: TransactionFormData = {
  assetId: '',
  assetName: '',
  assetType: '',
  amount: 0,
  unitPrice: 0,
  totalAmount: 0,
  counterparty: '',
  department: '',
  projectId: '',
  transactionDate: new Date().toISOString().split('T')[0],
  operator: '当前用户',
  remark: '',
};

const tabOptions: Array<{ key: TransactionType | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'buy', label: '买入' },
  { key: 'sell', label: '卖出' },
  { key: 'performance', label: '履约抵扣' },
  { key: 'freeze', label: '冻结' },
  { key: 'unfreeze', label: '解冻' },
];

export default function Transactions() {
  const {
    assets,
    transactions,
    departments,
    projects,
    filterTransactions,
    addTransaction,
    getDepartmentName,
    getProjectName,
    getAssetById,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TransactionType | 'all'>('all');
  const [filters, setFilters] = useState<Omit<FilterParams, 'status'> & { type?: TransactionType; status?: TransactionStatus }>({});
  const [modalType, setModalType] = useState<TransactionModalType>(null);
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [exporting, setExporting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CarbonAsset | null>(null);

  const availableAssets = useMemo(() => {
    return assets.filter((a) => a.status === 'available');
  }, [assets]);

  const filteredTransactions = useMemo(() => {
    const finalFilters: Omit<FilterParams, 'status'> & { type?: TransactionType; status?: TransactionStatus } = { ...filters };
    if (activeTab !== 'all') {
      finalFilters.type = activeTab as TransactionType;
    }
    return filterTransactions(finalFilters);
  }, [transactions, filters, activeTab, filterTransactions]);

  const typeOptions = Object.entries(TransactionTypeLabels).map(([value, label]) => ({
    label,
    value,
  }));

  const statusOptions = Object.entries(TransactionStatusLabels).map(([value, label]) => ({
    label,
    value,
  }));

  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d.id,
  }));

  const filterConfigs = [
    { key: 'type', label: '交易类型', type: 'select' as const, options: typeOptions },
    { key: 'status', label: '状态', type: 'select' as const, options: statusOptions },
    { key: 'department', label: '部门', type: 'select' as const, options: departmentOptions, advanced: true },
    { key: 'dateRange', label: '日期范围', type: 'dateRange' as const },
    { key: 'keyword', label: '搜索', type: 'search' as const, placeholder: '搜索资产名称/编号/交易对手' },
  ];

  const handleFilter = (values: Record<string, unknown>) => {
    const dateRange = values.dateRange as [string, string] | undefined;
    setFilters({
      type: values.type as TransactionType | undefined,
      status: values.status as TransactionStatus | undefined,
      department: values.department as string | undefined,
      startDate: dateRange?.[0] || undefined,
      endDate: dateRange?.[1] || undefined,
      keyword: values.keyword as string | undefined,
    });
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportTransactionsToExcel(filteredTransactions);
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  const openModal = (type: TransactionModalType) => {
    setFormData(initialFormData);
    setSelectedAsset(null);
    setModalType(type);
  };

  const handleAssetSelect = (assetId: string) => {
    const asset = getAssetById(assetId);
    if (asset) {
      setSelectedAsset(asset);
      setFormData({
        ...formData,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type,
        department: asset.department,
      });
    }
  };

  const handleSubmitTransaction = () => {
    if (!formData.assetId || formData.amount <= 0) {
      return;
    }

    const type = modalType as TransactionType;
    const unitPrice = formData.unitPrice || 0;
    const totalAmount = formData.amount * unitPrice;

    addTransaction({
      type,
      assetId: formData.assetId,
      assetName: formData.assetName,
      assetType: formData.assetType as never,
      amount: formData.amount,
      unitPrice: unitPrice || undefined,
      totalAmount: totalAmount || undefined,
      counterparty: formData.counterparty || undefined,
      department: formData.department,
      projectId: formData.projectId || undefined,
      status: 'completed',
      transactionDate: formData.transactionDate,
      remark: formData.remark || undefined,
      operator: formData.operator,
    });

    setModalType(null);
    setFormData(initialFormData);
    setSelectedAsset(null);
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'buy':
        return '登记买入';
      case 'sell':
        return '登记卖出';
      case 'performance':
        return '履约抵扣';
      case 'freeze':
        return '冻结资产';
      case 'unfreeze':
        return '解冻资产';
      default:
        return '';
    }
  };

  const columns = [
    {
      key: 'id',
      title: '交易编号',
      width: '140px',
      render: (record: Transaction) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {record.id}
        </span>
      ),
    },
    {
      key: 'type',
      title: '交易类型',
      render: (record: Transaction) => {
        const typeColors: Record<string, string> = {
          buy: 'green',
          sell: 'red',
          performance: 'blue',
          freeze: 'yellow',
          unfreeze: 'cyan',
        };
        return (
          <Badge color={typeColors[record.type] as never}>
            {getTransactionTypeLabel(record.type)}
          </Badge>
        );
      },
    },
    {
      key: 'assetName',
      title: '资产信息',
      render: (record: Transaction) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{record.assetName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getAssetTypeLabel(record.assetType)}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '数量',
      align: 'right' as const,
      render: (record: Transaction) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {formatCarbon(record.amount)}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      title: '金额',
      align: 'right' as const,
      render: (record: Transaction) => (
        <span className="text-gray-700 dark:text-gray-300">
          {record.totalAmount ? formatCurrency(record.totalAmount) : '-'}
        </span>
      ),
    },
    {
      key: 'counterparty',
      title: '交易对手',
      render: (record: Transaction) => (
        <span>{record.counterparty || '-'}</span>
      ),
    },
    {
      key: 'department',
      title: '所属部门',
      render: (record: Transaction) => (
        <span>{getDepartmentName(record.department)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record: Transaction) => (
        <Badge status={record.status as never} dot>
          {getTransactionStatusLabel(record.status)}
        </Badge>
      ),
    },
    {
      key: 'transactionDate',
      title: '交易日期',
      render: (record: Transaction) => (
        <span>{formatDate(record.transactionDate)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">交易记录</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            查看和管理所有碳资产交易记录
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            loading={exporting}
            onClick={handleExportExcel}
          >
            导出Excel
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1 px-4 overflow-x-auto">
            {tabOptions.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2',
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={<TrendingDown className="w-4 h-4" />}
              onClick={() => openModal('buy')}
            >
              登记买入
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<TrendingUp className="w-4 h-4" />}
              onClick={() => openModal('sell')}
            >
              登记卖出
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={() => openModal('performance')}
            >
              履约抵扣
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Snowflake className="w-4 h-4" />}
              onClick={() => openModal('freeze')}
            >
              冻结
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Sun className="w-4 h-4" />}
              onClick={() => openModal('unfreeze')}
            >
              解冻
            </Button>
          </div>
        </div>

        <div className="p-4">
          <FilterBar
            filters={filterConfigs}
            onFilter={handleFilter}
            showAdvanced={true}
          />
        </div>

        <div className="px-4 pb-4">
          <Table
            columns={columns}
            data={filteredTransactions}
            pagination={{ pageSize: 10, showTotal: true }}
            striped={true}
            hoverable={true}
          />
        </div>
      </Card>

      <Modal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        title={getModalTitle()}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalType(null)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitTransaction}>
              确认提交
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              选择资产
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.assetId}
                onChange={(e) => handleAssetSelect(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white appearance-none cursor-pointer"
              >
                <option value="">请选择资产</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({AssetTypeLabels[asset.type]}) - {formatCarbon(asset.amount)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedAsset && (
            <div className="col-span-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">可用余额：</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCarbon(selectedAsset.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">资产类型：</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {AssetTypeLabels[selectedAsset.type]}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">所属部门：</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getDepartmentName(selectedAsset.department)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              交易数量 (tCO₂e)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                const amount = Number(e.target.value);
                setFormData({
                  ...formData,
                  amount,
                  totalAmount: amount * formData.unitPrice,
                });
              }}
              placeholder="请输入数量"
              min="0"
              step="0.01"
              max={selectedAsset?.amount || undefined}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>

          {(modalType === 'buy' || modalType === 'sell') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  单价 (元/吨)
                </label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => {
                    const unitPrice = Number(e.target.value);
                    setFormData({
                      ...formData,
                      unitPrice,
                      totalAmount: formData.amount * unitPrice,
                    });
                  }}
                  placeholder="请输入单价"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  总金额 (元)
                </label>
                <input
                  type="text"
                  value={formData.totalAmount.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  交易对手
                </label>
                <input
                  type="text"
                  value={formData.counterparty}
                  onChange={(e) =>
                    setFormData({ ...formData, counterparty: e.target.value })
                  }
                  placeholder="请输入交易对手"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              交易日期
            </label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) =>
                setFormData({ ...formData, transactionDate: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              关联项目
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white appearance-none cursor-pointer"
            >
              <option value="">无</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              操作员
            </label>
            <input
              type="text"
              value={formData.operator}
              disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              备注说明
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              placeholder="请输入备注说明"
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
