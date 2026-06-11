import { useState, useMemo } from 'react';
import {
  Plus,
  LayoutGrid,
  List,
  Download,
  Calendar,
  User,
  TrendingUp,
  DollarSign,
  Leaf,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  Edit3,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  ProjectStatusLabels,
  type ReductionProject,
  type ProjectStatus,
  type ProjectMilestone,
} from '@/types';
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatCarbon,
  getProjectStatusLabel,
} from '@/utils/format';
import { exportProjectsToExcel } from '@/utils/export';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FilterBar from '@/components/ui/FilterBar';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import type { Column } from '@/components/ui/Table';

type ViewMode = 'card' | 'list';

interface ProjectFormData {
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
  estimatedRevenue: number;
  description: string;
}

interface ProgressFormData {
  progress: number;
  actualReduction: number;
  actualRevenue: number;
}

const statusIconMap: Record<ProjectStatus, React.ReactNode> = {
  planning: <Clock className="w-4 h-4" />,
  ongoing: <TrendingUp className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  suspended: <PauseCircle className="w-4 h-4" />,
};

const statusColorMap: Record<ProjectStatus, string> = {
  planning: 'bg-blue-500',
  ongoing: 'bg-primary-600',
  completed: 'bg-green-500',
  suspended: 'bg-orange-500',
};

const progressGradientMap: Record<ProjectStatus, string> = {
  planning: 'from-blue-400 to-blue-600',
  ongoing: 'from-primary-400 to-primary-600',
  completed: 'from-green-400 to-green-600',
  suspended: 'from-orange-400 to-orange-600',
};

const milestoneStatusColor: Record<ProjectMilestone['status'], string> = {
  pending: 'bg-gray-400',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

export default function Projects() {
  const { projects, departments, addProject, updateProjectProgress, getDepartmentName } =
    useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    keyword: '',
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ReductionProject | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    code: '',
    type: '',
    department: '',
    manager: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    totalInvestment: 0,
    estimatedReduction: 0,
    estimatedRevenue: 0,
    description: '',
  });
  const [progressData, setProgressData] = useState<ProgressFormData>({
    progress: 0,
    actualReduction: 0,
    actualRevenue: 0,
  });

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.department && p.department !== filters.department) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !p.name.toLowerCase().includes(kw) &&
          !p.code.toLowerCase().includes(kw) &&
          !p.manager.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [projects, filters]);

  const filterConfig = [
    {
      key: 'status',
      label: '项目状态',
      type: 'select' as const,
      options: [
        { label: '规划中', value: 'planning' },
        { label: '进行中', value: 'ongoing' },
        { label: '已完成', value: 'completed' },
        { label: '已暂停', value: 'suspended' },
      ],
    },
    {
      key: 'department',
      label: '所属部门',
      type: 'select' as const,
      options: departments.map((d) => ({ label: d.name, value: d.id })),
    },
    {
      key: 'keyword',
      label: '搜索项目',
      type: 'search' as const,
      placeholder: '输入项目名称、编号或负责人',
    },
  ];

  const handleFilter = (values: Record<string, string | number | [string, string] | null>) => {
    setFilters({
      status: (values.status as string) || '',
      department: (values.department as string) || '',
      keyword: (values.keyword as string) || '',
    });
  };

  const handleExport = () => {
    exportProjectsToExcel(filteredProjects);
  };

  const handleViewDetail = (project: ReductionProject) => {
    setSelectedProject(project);
    setDetailModalOpen(true);
  };

  const handleOpenProgressModal = (project: ReductionProject) => {
    setSelectedProject(project);
    setProgressData({
      progress: project.progress,
      actualReduction: project.actualReduction,
      actualRevenue: project.actualRevenue,
    });
    setProgressModalOpen(true);
  };

  const handleCreateProject = () => {
    if (!formData.name || !formData.code || !formData.department) {
      return;
    }
    addProject({
      ...formData,
      actualReduction: 0,
      actualRevenue: 0,
      progress: 0,
      milestones: [],
    });
    setCreateModalOpen(false);
    setFormData({
      name: '',
      code: '',
      type: '',
      department: '',
      manager: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      totalInvestment: 0,
      estimatedReduction: 0,
      estimatedRevenue: 0,
      description: '',
    });
  };

  const handleUpdateProgress = () => {
    if (!selectedProject) return;
    updateProjectProgress(
      selectedProject.id,
      progressData.progress,
      progressData.actualReduction,
      progressData.actualRevenue
    );
    setProgressModalOpen(false);
    setSelectedProject(null);
  };

  const columns: Column<ReductionProject>[] = [
    {
      key: 'name',
      title: '项目名称',
      render: (record) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              statusColorMap[record.status as ProjectStatus]
            )}
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{record.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record) => (
        <Badge
          status={
            record.status === 'completed'
              ? 'available'
              : record.status === 'ongoing'
                ? 'active'
                : record.status === 'suspended'
                  ? 'warning'
                  : 'pending'
          }
          dot
        >
          {getProjectStatusLabel(record.status as ProjectStatus)}
        </Badge>
      ),
    },
    {
      key: 'progress',
      title: '进度',
      width: '180px',
      render: (record) => (
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatNumber(record.progress, 0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full bg-gradient-to-r rounded-full progress-bar',
                progressGradientMap[record.status as ProjectStatus]
              )}
              style={{ width: `${record.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'manager',
      title: '负责人',
      render: (record) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{record.manager}</span>
        </div>
      ),
    },
    {
      key: 'department',
      title: '部门',
      render: (record) => getDepartmentName(record.department),
    },
    {
      key: 'estimatedReduction',
      title: '预计减排',
      align: 'right',
      render: (record) => (
        <div className="text-right">
          <div className="font-medium">{formatCarbon(record.estimatedReduction, 0)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            实际: {formatCarbon(record.actualReduction, 0)}
          </div>
        </div>
      ),
    },
    {
      key: 'estimatedRevenue',
      title: '预估收益',
      align: 'right',
      render: (record) => (
        <div className="text-right">
          <div className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(record.estimatedRevenue, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            实际: {formatCurrency(record.actualRevenue, 0)}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '120px',
      render: (record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => handleOpenProgressModal(record)}
          >
            更新
          </Button>
        </div>
      ),
    },
  ];

  const renderProjectCard = (project: ReductionProject) => (
    <Card
      key={project.id}
      hoverable
      className="group"
      onClick={() => handleViewDetail(project)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusIconMap[project.status as ProjectStatus]}
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {project.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{project.code}</p>
        </div>
        <Badge
          status={
            project.status === 'completed'
              ? 'available'
              : project.status === 'ongoing'
                ? 'active'
                : project.status === 'suspended'
                  ? 'warning'
                  : 'pending'
          }
          dot
        >
          {getProjectStatusLabel(project.status as ProjectStatus)}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">项目进度</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatNumber(project.progress, 0)}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full bg-gradient-to-r rounded-full progress-bar',
              progressGradientMap[project.status as ProjectStatus]
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 dark:text-gray-300 truncate">{project.manager}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 dark:text-gray-300">
            {formatDate(project.startDate)}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Leaf className="w-4 h-4 text-primary-500" />
            <span>减排量</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCarbon(project.actualReduction, 0)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {' / '}
              {formatCarbon(project.estimatedReduction, 0)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span>预估收益</span>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {formatCurrency(project.estimatedRevenue, 0)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>{getDepartmentName(project.department)}</span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          截止 {formatDate(project.endDate)}
        </span>
      </div>
    </Card>
  );

  const renderMilestoneTimeline = (milestones: ProjectMilestone[]) => (
    <div className="relative">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 z-10',
                milestoneStatusColor[milestone.status]
              )}
            />
            {index < milestones.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{milestone.name}</h4>
              <Badge
                status={
                  milestone.status === 'completed'
                    ? 'available'
                    : milestone.status === 'delayed'
                      ? 'warning'
                      : 'pending'
                }
              >
                {milestone.status === 'completed'
                  ? '已完成'
                  : milestone.status === 'delayed'
                    ? '延期'
                    : '待处理'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                目标: {formatDate(milestone.targetDate)}
              </span>
              {milestone.actualDate && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  实际: {formatDate(milestone.actualDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">减排项目</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            管理和跟踪所有碳减排项目的进度与成果
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            导出 Excel
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            新增项目
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <FilterBar filters={filterConfig} onFilter={handleFilter} showAdvanced={false} />
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setViewMode('card')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              viewMode === 'card'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            卡片视图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <List className="w-4 h-4" />
            列表视图
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        共 {filteredProjects.length} 个项目
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(renderProjectCard)}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredProjects}
          rowKey="id"
          onRowClick={(record) => handleViewDetail(record)}
          pagination={{ pageSize: 10, showTotal: true }}
        />
      )}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="创建新项目"
        width="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleCreateProject}>
              创建项目
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              项目名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="请输入项目名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              项目编号 *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input-field"
              placeholder="如: PRJ-2024-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              项目类型
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-field"
              placeholder="如: 风电项目、光伏项目"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              所属部门 *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="input-field"
            >
              <option value="">请选择部门</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              负责人
            </label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="input-field"
              placeholder="请输入负责人姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              项目状态
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as ProjectStatus })
              }
              className="input-field"
            >
              {Object.entries(ProjectStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              开始日期
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              结束日期
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              总投资 (元)
            </label>
            <input
              type="number"
              value={formData.totalInvestment || ''}
              onChange={(e) =>
                setFormData({ ...formData, totalInvestment: Number(e.target.value) })
              }
              className="input-field"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              预计减排量 (吨CO₂e)
            </label>
            <input
              type="number"
              value={formData.estimatedReduction || ''}
              onChange={(e) =>
                setFormData({ ...formData, estimatedReduction: Number(e.target.value) })
              }
              className="input-field"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              预估收益 (元)
            </label>
            <input
              type="number"
              value={formData.estimatedRevenue || ''}
              onChange={(e) =>
                setFormData({ ...formData, estimatedRevenue: Number(e.target.value) })
              }
              className="input-field"
              placeholder="0"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              项目描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[100px] resize-y"
              placeholder="请输入项目描述..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedProject(null);
        }}
        title={selectedProject?.name}
        width="max-w-3xl"
        footer={
          selectedProject &&
          selectedProject.status !== 'completed' && (
            <>
              <Button variant="ghost" onClick={() => setDetailModalOpen(false)}>
                关闭
              </Button>
              <Button
                variant="primary"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenProgressModal(selectedProject);
                }}
              >
                更新进度
              </Button>
            </>
          )
        }
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  status={
                    selectedProject.status === 'completed'
                      ? 'available'
                      : selectedProject.status === 'ongoing'
                        ? 'active'
                        : selectedProject.status === 'suspended'
                          ? 'warning'
                          : 'pending'
                  }
                  dot
                >
                  {getProjectStatusLabel(selectedProject.status as ProjectStatus)}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedProject.code}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getDepartmentName(selectedProject.department)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card padding="sm" className="bg-gradient-to-br from-primary-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">项目进度</div>
                <div className="text-2xl font-bold text-primary-700 dark:text-primary-500">
                  {formatNumber(selectedProject.progress, 0)}%
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-green-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">实际减排</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-500">
                  {formatCarbon(selectedProject.actualReduction, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-blue-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">预计减排</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-500">
                  {formatCarbon(selectedProject.estimatedReduction, 0)}
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-amber-50 to-white">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">预估收益</div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">
                  {formatCurrency(selectedProject.estimatedRevenue, 0)}
                </div>
              </Card>
            </div>

            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full bg-gradient-to-r rounded-full progress-bar',
                  progressGradientMap[selectedProject.status as ProjectStatus]
                )}
                style={{ width: `${selectedProject.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">负责人</div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedProject.manager}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">项目类型</div>
                <div className="font-medium">{selectedProject.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">开始日期</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(selectedProject.startDate)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">结束日期</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(selectedProject.endDate)}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">总投资</div>
                <div className="font-medium">{formatCurrency(selectedProject.totalInvestment, 0)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">实际收益</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(selectedProject.actualRevenue, 0)}
                </div>
              </div>
            </div>

            {selectedProject.description && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">项目描述</div>
                <p className="text-gray-700 dark:text-gray-300">{selectedProject.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                项目里程碑
              </h3>
              {selectedProject.milestones.length > 0 ? (
                renderMilestoneTimeline(selectedProject.milestones)
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无里程碑数据</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={progressModalOpen}
        onClose={() => {
          setProgressModalOpen(false);
          setSelectedProject(null);
        }}
        title="更新项目进度"
        width="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setProgressModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleUpdateProgress}>
              确认更新
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              项目进度 (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progressData.progress}
              onChange={(e) =>
                setProgressData({ ...progressData, progress: Number(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
              <span className="text-xl font-bold text-primary-700 dark:text-primary-500">
                {progressData.progress}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              实际减排量 (吨CO₂e)
            </label>
            <input
              type="number"
              value={progressData.actualReduction || ''}
              onChange={(e) =>
                setProgressData({
                  ...progressData,
                  actualReduction: Number(e.target.value),
                })
              }
              className="input-field"
              placeholder="0"
            />
            {selectedProject && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                预计减排量: {formatCarbon(selectedProject.estimatedReduction, 0)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              实际收益 (元)
            </label>
            <input
              type="number"
              value={progressData.actualRevenue || ''}
              onChange={(e) =>
                setProgressData({
                  ...progressData,
                  actualRevenue: Number(e.target.value),
                })
              }
              className="input-field"
              placeholder="0"
            />
            {selectedProject && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                预估收益: {formatCurrency(selectedProject.estimatedRevenue, 0)}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
