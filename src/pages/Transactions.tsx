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
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type {
  Transaction,
  FilterParams,
  TransactionType,
  TransactionStatus,
  CarbonAsset,
  AssetType,
  AssetSource,
} from '@/types';
import {
  TransactionTypeLabels,
  TransactionStatusLabels,
  AssetTypeLabels,
  AssetSourceLabels,
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
  getStatusColorClass,
} from '@/utils/format';
import { exportTransactionsToExcel } from '@/utils/export';
import { cn } from '@/lib/utils';

type TransactionModalType = 'buy' | 'sell' | 'performance' | 'freeze' | 'unfreeze' | null;

interface BuyFormData {
  name: string;
  type: AssetType;
  amount: number;
  unitPrice: number;
  source: AssetSource;
  year: number;
  department: string;
  projectId: string;
  acquiredDate: string;
  expiryDate: string;
  description: string;
  counterparty: string;
  transactionDate: string;
  operator: string;
  remark: string;
}

interface TransactionFormData {
  assetId: string;
  amount: number;
  unitPrice: number;
  counterparty: string;
  department: string;
  projectId: string;
  transactionDate: string;
  operator: string;
  remark: string;
}

const initialBuyFormData: BuyFormData = {
  name: '',
  type: 'quota',
  amount: 0,
  unitPrice: 0,
  source: 'purchase',
  year: new Date().getFullYear(),
  department: '',
  projectId: '',
  acquiredDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  description: '',
  counterparty: '',
  transactionDate: new Date().toISOString().split('T')[0],
  operator: '当前用户',
  remark: '',
};

const initialTransactionFormData: TransactionFormData = {
  assetId: '',
  amount: 0,
  unitPrice: 0,
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

const assetTypeOptions = Object.entries(AssetTypeLabels).map(([value, label]) => ({
  label,
  value,
}));

const assetSourceOptions = Object.entries(AssetSourceLabels).map(([value, label]) => ({
  label,
  value,
}));

export default function Transactions() {
  const {
    assets,
    transactions,
    departments,
    projects,
    filterTransactions,
    getDepartmentName,
    getProjectName,
    getAssetById,
    getAvailableAssets,
    getFrozenAssets,
    buyAsset,
    sellAsset,
    performanceDeduction,
    freezeAsset,
    unfreezeAsset,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TransactionType | 'all'>('all');
  const [filters, setFilters] = useState<Omit<FilterParams, 'status'> & { type?: TransactionType; status?: TransactionStatus }>({});
  const [modalType, setModalType] = useState<TransactionModalType>(null);
  const [buyFormData, setBuyFormData] = useState<BuyFormData>(initialBuyFormData);
  const [transactionFormData, setTransactionFormData] = useState<TransactionFormData>(initialTransactionFormData);
  const [exporting, setExporting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CarbonAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  const availableAssets = useMemo(() => getAvailableAssets(), [assets]);
  const frozenAssets = useMemo(() => getFrozenAssets(), [assets]);

  const getSelectableAssets = () => {
    if (modalType === 'freeze') return availableAssets;
    if (modalType === 'unfreeze') return frozenAssets;
    return availableAssets;
  };

  const filteredTransactions = useMemo(() => {
    const finalFilters = { ...filters } as Omit<FilterParams, 'status'> & { type?: TransactionType; status?: TransactionStatus };
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

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => ({
    label: `${year}年`,
    value: year,
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
    } as Omit<FilterParams, 'status'> & { type?: TransactionType; status?: TransactionStatus });
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
    setBuyFormData(initialBuyFormData);
    setTransactionFormData(initialTransactionFormData);
    setSelectedAsset(null);
    setErrorMessage('');
    setModalType(type);
  };

  const handleAssetSelect = (assetId: string) => {
    const asset = getAssetById(assetId);
    if (asset) {
      setSelectedAsset(asset);
      setTransactionFormData({
        ...transactionFormData,
        assetId: asset.id,
        department: asset.department,
      });
    }
  };

  const validateTransaction = (): boolean => {
    if (modalType === 'buy') {
      if (!buyFormData.name) {
        setErrorMessage('请输入资产名称');
        return false;
      }
      if (!buyFormData.type) {
        setErrorMessage('请选择资产类型');
        return false;
      }
      if (!buyFormData.source) {
        setErrorMessage('请选择资产来源');
        return false;
      }
      if (!buyFormData.department) {
        setErrorMessage('请选择所属部门');
        return false;
      }
      if (buyFormData.amount <= 0) {
        setErrorMessage('交易数量必须大于0');
        return false;
      }
      if (buyFormData.unitPrice < 0) {
        setErrorMessage('单价不能为负数');
        return false;
      }
    } else {
      if (!transactionFormData.assetId) {
        setErrorMessage('请选择资产');
        return false;
      }
      const asset = getAssetById(transactionFormData.assetId);
      if (!asset) {
        setErrorMessage('资产不存在');
        return false;
      }
      if (transactionFormData.amount <= 0) {
        setErrorMessage('交易数量必须大于0');
        return false;
      }
      if (transactionFormData.amount > asset.amount) {
        setErrorMessage(`交易数量(${transactionFormData.amount})不能超过可用余额(${asset.amount})`);
        return false;
      }
      if (modalType === 'sell' && transactionFormData.unitPrice < 0) {
        setErrorMessage('单价不能为负数');
        return false;
      }
    }
    return true;
  };

  const handleSubmitTransaction = () => {
    if (!validateTransaction()) {
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmitTransaction = () => {
    setShowConfirm(false);

    let result;

    if (modalType === 'buy') {
      result = buyAsset({
        name: buyFormData.name,
        type: buyFormData.type,
        amount: buyFormData.amount,
        unitPrice: buyFormData.unitPrice,
        source: buyFormData.source,
        year: buyFormData.year,
        department: buyFormData.department,
        projectId: buyFormData.projectId || undefined,
        acquiredDate: buyFormData.acquiredDate,
        expiryDate: buyFormData.expiryDate || undefined,
        description: buyFormData.description || undefined,
        counterparty: buyFormData.counterparty || undefined,
        transactionDate: buyFormData.transactionDate,
        operator: buyFormData.operator,
        remark: buyFormData.remark || undefined,
      });
    } else if (modalType === 'sell') {
      result = sellAsset({
        assetId: transactionFormData.assetId,
        amount: transactionFormData.amount,
        unitPrice: transactionFormData.unitPrice || undefined,
        counterparty: transactionFormData.counterparty || undefined,
        department: transactionFormData.department,
        projectId: transactionFormData.projectId || undefined,
        transactionDate: transactionFormData.transactionDate,
        operator: transactionFormData.operator,
        remark: transactionFormData.remark || undefined,
      });
    } else if (modalType === 'performance') {
      result = performanceDeduction({
        assetId: transactionFormData.assetId,
        amount: transactionFormData.amount,
        department: transactionFormData.department,
        projectId: transactionFormData.projectId || undefined,
        transactionDate: transactionFormData.transactionDate,
        operator: transactionFormData.operator,
        remark: transactionFormData.remark || undefined,
      });
    } else if (modalType === 'freeze') {
      result = freezeAsset({
        assetId: transactionFormData.assetId,
        amount: transactionFormData.amount,
        department: transactionFormData.department,
        projectId: transactionFormData.projectId || undefined,
        transactionDate: transactionFormData.transactionDate,
        operator: transactionFormData.operator,
        remark: transactionFormData.remark || undefined,
      });
    } else if (modalType === 'unfreeze') {
      result = unfreezeAsset({
        assetId: transactionFormData.assetId,
        amount: transactionFormData.amount,
        department: transactionFormData.department,
        projectId: transactionFormData.projectId || undefined,
        transactionDate: transactionFormData.transactionDate,
        operator: transactionFormData.operator,
        remark: transactionFormData.remark || undefined,
      });
    }

    if (result?.success) {
      setModalType(null);
      setBuyFormData(initialBuyFormData);
      setTransactionFormData(initialTransactionFormData);
      setSelectedAsset(null);
      setErrorMessage('');
    } else {
      setErrorMessage(result?.error || '操作失败，请重试');
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'buy':
        return '登记买入（新增资产）';
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

  const getTotalAmount = () => {
    if (modalType === 'buy') {
      return buyFormData.amount * buyFormData.unitPrice;
    }
    return transactionFormData.amount * transactionFormData.unitPrice;
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

  const selectableAssets = getSelectableAssets();

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
        width="max-w-3xl"
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
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{errorMessage}</span>
          </div>
        )}

        {modalType === 'buy' ? (
          <div className="space-y-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <span className="font-medium">提示：</span>买入交易将创建新的碳资产记录，请完整填写资产信息。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  资产名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buyFormData.name}
                  onChange={(e) => setBuyFormData({ ...buyFormData, name: e.target.value })}
                  placeholder="请输入资产名称，如：2026年度碳排放配额"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  资产类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={buyFormData.type}
                  onChange={(e) => setBuyFormData({ ...buyFormData, type: e.target.value as AssetType })}
                  className="input-field appearance-none cursor-pointer"
                >
                  {assetTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  资产来源 <span className="text-red-500">*</span>
                </label>
                <select
                  value={buyFormData.source}
                  onChange={(e) => setBuyFormData({ ...buyFormData, source: e.target.value as AssetSource })}
                  className="input-field appearance-none cursor-pointer"
                >
                  {assetSourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  年度 <span className="text-red-500">*</span>
                </label>
                <select
                  value={buyFormData.year}
                  onChange={(e) => setBuyFormData({ ...buyFormData, year: Number(e.target.value) })}
                  className="input-field appearance-none cursor-pointer"
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  所属部门 <span className="text-red-500">*</span>
                </label>
                <select
                  value={buyFormData.department}
                  onChange={(e) => setBuyFormData({ ...buyFormData, department: e.target.value })}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="">请选择部门</option>
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  数量 (tCO₂e) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={buyFormData.amount}
                  onChange={(e) => {
                    const amount = Number(e.target.value);
                    setBuyFormData({ ...buyFormData, amount });
                  }}
                  placeholder="请输入数量"
                  min="0"
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  单价 (元/吨) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={buyFormData.unitPrice}
                  onChange={(e) => {
                    const unitPrice = Number(e.target.value);
                    setBuyFormData({ ...buyFormData, unitPrice });
                  }}
                  placeholder="请输入单价"
                  min="0"
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  总金额 (元)
                </label>
                <input
                  type="text"
                  value={getTotalAmount().toLocaleString('zh-CN', {
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
                  value={buyFormData.counterparty}
                  onChange={(e) => setBuyFormData({ ...buyFormData, counterparty: e.target.value })}
                  placeholder="请输入交易对手"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  获取日期
                </label>
                <input
                  type="date"
                  value={buyFormData.acquiredDate}
                  onChange={(e) => setBuyFormData({ ...buyFormData, acquiredDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  到期日期
                </label>
                <input
                  type="date"
                  value={buyFormData.expiryDate}
                  onChange={(e) => setBuyFormData({ ...buyFormData, expiryDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  关联项目
                </label>
                <select
                  value={buyFormData.projectId}
                  onChange={(e) => setBuyFormData({ ...buyFormData, projectId: e.target.value })}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="">无</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  交易日期
                </label>
                <input
                  type="date"
                  value={buyFormData.transactionDate}
                  onChange={(e) => setBuyFormData({ ...buyFormData, transactionDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  操作员
                </label>
                <input
                  type="text"
                  value={buyFormData.operator}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  资产描述
                </label>
                <textarea
                  value={buyFormData.description}
                  onChange={(e) => setBuyFormData({ ...buyFormData, description: e.target.value })}
                  placeholder="请输入资产描述信息"
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  备注说明
                </label>
                <textarea
                  value={buyFormData.remark}
                  onChange={(e) => setBuyFormData({ ...buyFormData, remark: e.target.value })}
                  placeholder="请输入备注说明"
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                选择资产 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={transactionFormData.assetId}
                  onChange={(e) => handleAssetSelect(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">请选择资产</option>
                  {selectableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({AssetTypeLabels[asset.type]}) - {formatCarbon(asset.amount)}
                    </option>
                  ))}
                </select>
              </div>
              {modalType === 'freeze' && selectableAssets.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">当前没有可冻结的可用资产</p>
              )}
              {modalType === 'unfreeze' && selectableAssets.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">当前没有可解冻的冻结资产</p>
              )}
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
                    <span className="text-gray-500 dark:text-gray-400">资产状态：</span>
                    <span className={cn('badge', getStatusColorClass(selectedAsset.status))}>
                      {selectedAsset.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                交易数量 (tCO₂e) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={transactionFormData.amount}
                onChange={(e) => {
                  const amount = Number(e.target.value);
                  setTransactionFormData({
                    ...transactionFormData,
                    amount,
                  });
                }}
                placeholder="请输入数量"
                min="0"
                step="0.01"
                max={selectedAsset?.amount || undefined}
                className="input-field"
              />
              {selectedAsset && (
                <p className="mt-1 text-xs text-gray-500">
                  最大可操作数量：{formatCarbon(selectedAsset.amount)}
                </p>
              )}
            </div>

            {(modalType === 'sell') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    单价 (元/吨)
                  </label>
                  <input
                    type="number"
                    value={transactionFormData.unitPrice}
                    onChange={(e) => {
                      const unitPrice = Number(e.target.value);
                      setTransactionFormData({
                        ...transactionFormData,
                        unitPrice,
                      });
                    }}
                    placeholder="请输入单价"
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    总金额 (元)
                  </label>
                  <input
                    type="text"
                    value={getTotalAmount().toLocaleString('zh-CN', {
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
                    value={transactionFormData.counterparty}
                    onChange={(e) =>
                      setTransactionFormData({ ...transactionFormData, counterparty: e.target.value })
                    }
                    placeholder="请输入交易对手"
                    className="input-field"
                  />
                </div>
              </>
            )}

            <div className={(modalType === 'sell') ? '' : 'col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                交易日期
              </label>
              <input
                type="date"
                value={transactionFormData.transactionDate}
                onChange={(e) =>
                  setTransactionFormData({ ...transactionFormData, transactionDate: e.target.value })
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                关联项目
              </label>
              <select
                value={transactionFormData.projectId}
                onChange={(e) =>
                  setTransactionFormData({ ...transactionFormData, projectId: e.target.value })
                }
                className="input-field appearance-none cursor-pointer"
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
                value={transactionFormData.operator}
                disabled
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                备注说明
              </label>
              <textarea
                value={transactionFormData.remark}
                onChange={(e) =>
                  setTransactionFormData({ ...transactionFormData, remark: e.target.value })
                }
                placeholder="请输入备注说明"
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white resize-none"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSubmitTransaction}
        title="确认提交"
        content={`确定要提交这笔${getModalTitle()}吗？提交后将同时更新交易记录和资产台账。`}
        confirmText="确认提交"
        danger={modalType === 'sell' || modalType === 'performance'}
      />
    </div>
  );
}
