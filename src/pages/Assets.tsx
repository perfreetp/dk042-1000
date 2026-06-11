import { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Eye,
  Snowflake,
  Sun,
  History,
  X,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { CarbonAsset, FilterParams, AssetType, AssetStatus, AssetSource } from '@/types';
import {
  AssetTypeLabels,
  AssetStatusLabels,
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
  getAssetTypeLabel,
  getAssetStatusLabel,
  getAssetSourceLabel,
} from '@/utils/format';
import { exportAssetsToExcel } from '@/utils/export';
import { cn } from '@/lib/utils';

interface AssetFormData {
  type: AssetType;
  name: string;
  amount: number;
  unit: string;
  source: AssetSource;
  status: AssetStatus;
  year: number;
  department: string;
  projectId: string;
  unitPrice: number | '';
  cost: number;
  acquiredDate: string;
  expiryDate: string;
  description: string;
}

const initialFormData: AssetFormData = {
  type: 'quota',
  name: '',
  amount: 0,
  unit: 'tCO₂e',
  source: 'government',
  status: 'available',
  year: new Date().getFullYear(),
  department: '',
  projectId: '',
  unitPrice: '',
  cost: 0,
  acquiredDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  description: '',
};

export default function Assets() {
  const {
    assets,
    departments,
    projects,
    filterAssets,
    addAsset,
    updateAssetStatus,
    getDepartmentName,
    getProjectName,
  } = useAppStore();

  const [filters, setFilters] = useState<FilterParams>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CarbonAsset | null>(null);
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);
  const [exporting, setExporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    asset: CarbonAsset | null;
    targetStatus: AssetStatus | null;
  }>({ open: false, asset: null, targetStatus: null });
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const filteredAssets = useMemo(() => {
    return filterAssets(filters);
  }, [assets, filters, filterAssets]);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(assets.map((a) => a.year))).sort((a, b) => b - a);
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }
    return years.map((y) => ({ label: `${y}年`, value: y }));
  }, [assets]);

  const typeOptions = Object.entries(AssetTypeLabels).map(([value, label]) => ({
    label,
    value,
  }));

  const statusOptions = Object.entries(AssetStatusLabels).map(([value, label]) => ({
    label,
    value,
  }));

  const sourceOptions = Object.entries(AssetSourceLabels).map(([value, label]) => ({
    label,
    value,
  }));

  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d.id,
  }));

  const filterConfigs = [
    { key: 'year', label: '年度', type: 'select' as const, options: yearOptions },
    { key: 'type', label: '类型', type: 'select' as const, options: typeOptions },
    { key: 'status', label: '状态', type: 'select' as const, options: statusOptions },
    { key: 'source', label: '来源', type: 'select' as const, options: sourceOptions, advanced: true },
    { key: 'department', label: '部门', type: 'select' as const, options: departmentOptions, advanced: true },
    { key: 'keyword', label: '搜索', type: 'search' as const, placeholder: '搜索资产名称/编号' },
  ];

  const handleFilter = (values: Record<string, unknown>) => {
    setFilters({
      year: values.year as number | undefined,
      type: values.type as AssetType | undefined,
      status: values.status as AssetStatus | undefined,
      source: values.source as AssetSource | undefined,
      department: values.department as string | undefined,
      keyword: values.keyword as string | undefined,
    });
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportAssetsToExcel(filteredAssets);
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  const handleAddAsset = () => {
    setFormData(initialFormData);
    setAddModalOpen(true);
  };

  const handleSubmitAdd = () => {
    setErrorMessage('');

    if (!formData.name || formData.name.trim() === '') {
      setErrorMessage('请输入资产名称');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setErrorMessage('请输入有效的数量');
      return;
    }
    if (formData.unitPrice === '' || formData.unitPrice === null || formData.unitPrice === undefined) {
      setErrorMessage('请输入单价（政府免费配额请填0）');
      return;
    }
    if (typeof formData.unitPrice === 'number' && isNaN(formData.unitPrice)) {
      setErrorMessage('请输入有效的单价');
      return;
    }
    if (typeof formData.unitPrice === 'number' && formData.unitPrice < 0) {
      setErrorMessage('单价不能为负数');
      return;
    }
    if (!formData.department) {
      setErrorMessage('请选择所属部门');
      return;
    }
    if (!formData.acquiredDate) {
      setErrorMessage('请选择获得日期');
      return;
    }

    const price = typeof formData.unitPrice === 'number' ? formData.unitPrice : 0;
    const totalCost = Math.round(formData.amount * price * 100) / 100;
    addAsset({
      type: formData.type,
      name: formData.name,
      amount: formData.amount,
      unit: formData.unit,
      source: formData.source,
      status: formData.status,
      year: formData.year,
      department: formData.department,
      projectId: formData.projectId || undefined,
      unitPrice: price,
      cost: totalCost,
      acquiredDate: formData.acquiredDate,
      expiryDate: formData.expiryDate || undefined,
      description: formData.description || undefined,
    });
    setAddModalOpen(false);
    setFormData(initialFormData);
    setErrorMessage('');
  };

  const handleViewDetail = (asset: CarbonAsset) => {
    setSelectedAsset(asset);
    setActiveTab('info');
    setDetailModalOpen(true);
  };

  const handleStatusChange = (asset: CarbonAsset, targetStatus: AssetStatus) => {
    setConfirmDialog({ open: true, asset, targetStatus });
  };

  const confirmStatusChange = () => {
    if (confirmDialog.asset && confirmDialog.targetStatus) {
      updateAssetStatus(confirmDialog.asset.id, confirmDialog.targetStatus);
    }
    setConfirmDialog({ open: false, asset: null, targetStatus: null });
  };

  const columns = [
    {
      key: 'id',
      title: '资产编号',
      width: '140px',
      render: (record: CarbonAsset) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {record.id}
        </span>
      ),
    },
    {
      key: 'name',
      title: '资产名称',
      render: (record: CarbonAsset) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{record.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getAssetTypeLabel(record.type)}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '数量',
      align: 'right' as const,
      render: (record: CarbonAsset) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {formatCarbon(record.amount)}
        </span>
      ),
    },
    {
      key: 'cost',
      title: '成本',
      align: 'right' as const,
      render: (record: CarbonAsset) => (
        <span className="text-gray-700 dark:text-gray-300">
          {formatCurrency(record.cost)}
        </span>
      ),
    },
    {
      key: 'source',
      title: '来源',
      render: (record: CarbonAsset) => (
        <span>{getAssetSourceLabel(record.source)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record: CarbonAsset) => (
        <Badge status={record.status as never} dot>
          {getAssetStatusLabel(record.status)}
        </Badge>
      ),
    },
    {
      key: 'department',
      title: '所属部门',
      render: (record: CarbonAsset) => (
        <span>{getDepartmentName(record.department)}</span>
      ),
    },
    {
      key: 'expiryDate',
      title: '到期日期',
      render: (record: CarbonAsset) => (
        <span
          className={cn(
            record.expiryDate &&
              new Date(record.expiryDate) < new Date() &&
              'text-red-600 dark:text-red-400'
          )}
        >
          {record.expiryDate ? formatDate(record.expiryDate) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      align: 'center' as const,
      render: (record: CarbonAsset) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'available' ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Snowflake className="w-4 h-4" />}
              onClick={() => handleStatusChange(record, 'frozen')}
            >
              冻结
            </Button>
          ) : record.status === 'frozen' ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Sun className="w-4 h-4" />}
              onClick={() => handleStatusChange(record, 'available')}
            >
              解冻
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">资产台账</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            管理和查询所有碳资产信息
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
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddAsset}
          >
            新增资产
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filterConfigs}
        onFilter={handleFilter}
        showAdvanced={true}
      />

      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filteredAssets}
          pagination={{ pageSize: 10, showTotal: true }}
          striped={true}
          hoverable={true}
        />
      </Card>

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="新增碳资产"
        width="max-w-2xl"
        footer={
          <>
            {errorMessage && (
              <span className="text-sm text-red-600 dark:text-red-400 mr-auto">
                {errorMessage}
              </span>
            )}
            <Button variant="ghost" onClick={() => { setAddModalOpen(false); setErrorMessage(''); }}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmitAdd}>
              确认添加
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              资产类型
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              资产名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入资产名称"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              数量 (tCO₂e)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                const amount = Number(e.target.value);
                const price = typeof formData.unitPrice === 'number' ? formData.unitPrice : 0;
                setFormData({
                  ...formData,
                  amount,
                  cost: Math.round(amount * price * 100) / 100,
                });
              }}
              placeholder="请输入数量"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              单价 (元/吨)
            </label>
            <input
              type="number"
              value={formData.unitPrice}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setFormData({
                    ...formData,
                    unitPrice: '',
                    cost: 0,
                  });
                } else {
                  const unitPrice = Number(raw);
                  setFormData({
                    ...formData,
                    unitPrice,
                    cost: Math.round(formData.amount * unitPrice * 100) / 100,
                  });
                }
              }}
              placeholder="请输入单价（政府免费配额填0）"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              总成本 (元)
            </label>
            <input
              type="text"
              value={formData.cost.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              来源
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as AssetSource })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            >
              {sourceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              年度
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              placeholder="请输入年度"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              所属部门
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            >
              <option value="">请选择部门</option>
              {departmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              关联项目
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
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
              获取日期
            </label>
            <input
              type="date"
              value={formData.acquiredDate}
              onChange={(e) => setFormData({ ...formData, acquiredDate: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              到期日期
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              备注说明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入备注说明"
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="资产详情"
        width="max-w-3xl"
      >
        {selectedAsset && (
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === 'info'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <FileText className="w-4 h-4 inline mr-1.5" />
                基本信息
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === 'history'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <History className="w-4 h-4 inline mr-1.5" />
                变更历史
              </button>
            </div>

            {activeTab === 'info' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">资产编号</label>
                    <p className="font-mono text-sm text-gray-900 dark:text-white mt-1">
                      {selectedAsset.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">资产名称</label>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedAsset.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">资产类型</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {getAssetTypeLabel(selectedAsset.type)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">数量</label>
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                      {formatCarbon(selectedAsset.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">单价</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatCurrency(selectedAsset.unitPrice)} / 吨
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">总成本</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatCurrency(selectedAsset.cost)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">状态</label>
                    <div className="mt-1">
                      <Badge status={selectedAsset.status as never} dot>
                        {getAssetStatusLabel(selectedAsset.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">来源</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {getAssetSourceLabel(selectedAsset.source)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">年度</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedAsset.year}年
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">所属部门</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {getDepartmentName(selectedAsset.department)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">关联项目</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedAsset.projectId
                        ? getProjectName(selectedAsset.projectId)
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">获取日期</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatDate(selectedAsset.acquiredDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">到期日期</label>
                    <p
                      className={cn(
                        'mt-1',
                        selectedAsset.expiryDate &&
                          new Date(selectedAsset.expiryDate) < new Date()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {selectedAsset.expiryDate
                        ? formatDate(selectedAsset.expiryDate)
                        : '-'}
                    </p>
                  </div>
                </div>
                {selectedAsset.description && (
                  <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm text-gray-500 dark:text-gray-400">备注说明</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedAsset.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="relative pl-6 pb-6">
                  <div className="absolute left-0 top-1.5 w-3 h-3 bg-primary-500 rounded-full" />
                  <div className="absolute left-1.5 top-4 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">资产创建</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      初始状态：{getAssetStatusLabel(selectedAsset.status)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDateTime(selectedAsset.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">最近更新</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDateTime(selectedAsset.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, asset: null, targetStatus: null })}
        onConfirm={confirmStatusChange}
        title={
          confirmDialog.targetStatus === 'frozen' ? '确认冻结资产' : '确认解冻资产'
        }
        content={
          confirmDialog.asset
            ? `确定要${confirmDialog.targetStatus === 'frozen' ? '冻结' : '解冻'}资产 "${confirmDialog.asset.name}" 吗？${
                confirmDialog.targetStatus === 'frozen'
                  ? '冻结后该资产将无法用于交易和履约。'
                  : '解冻后该资产将恢复正常使用。'
              }`
            : ''
        }
        confirmText={confirmDialog.targetStatus === 'frozen' ? '确认冻结' : '确认解冻'}
        danger={confirmDialog.targetStatus === 'frozen'}
      />
    </div>
  );
}
