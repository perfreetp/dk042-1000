import { useState } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface SelectOption {
  label: string;
  value: string | number;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'dateRange' | 'search';
  options?: SelectOption[];
  placeholder?: string;
  advanced?: boolean;
}

interface FilterValues {
  [key: string]: string | number | [string, string] | null;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onFilter: (values: FilterValues) => void;
  initialValues?: FilterValues;
  showAdvanced?: boolean;
  className?: string;
}

export default function FilterBar({
  filters,
  onFilter,
  initialValues = {},
  showAdvanced = true,
  className,
}: FilterBarProps) {
  const [values, setValues] = useState<FilterValues>(initialValues);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const basicFilters = filters.filter((f) => !f.advanced);
  const advancedFilters = filters.filter((f) => f.advanced);

  const handleChange = (key: string, value: string | number | [string, string] | null) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(values);
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    filters.forEach((f) => {
      if (f.type === 'dateRange') {
        resetValues[f.key] = ['', ''];
      } else {
        resetValues[f.key] = '';
      }
    });
    setValues(resetValues);
    onFilter(resetValues);
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.key} className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filter.label}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={(value as string) || ''}
                onChange={(e) => handleChange(filter.key, e.target.value)}
                placeholder={filter.placeholder || `请输入${filter.label}`}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.key} className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filter.label}
            </label>
            <select
              value={(value as string | number) || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white appearance-none cursor-pointer"
            >
              <option value="">全部{filter.label}</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'dateRange':
        const [startDate, endDate] = (value as [string, string]) || ['', ''];
        return (
          <div key={filter.key} className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filter.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  handleChange(filter.key, [e.target.value, endDate])
                }
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
              />
              <span className="text-gray-500">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  handleChange(filter.key, [startDate, e.target.value])
                }
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {basicFilters.map(renderFilter)}

        <div className="flex items-end gap-2 ml-auto">
          <Button type="submit" variant="primary">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            重置
          </Button>
          {showAdvanced && advancedFilters.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              icon={
                advancedOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )
              }
            >
              高级筛选
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && advancedOpen && advancedFilters.length > 0 && (
        <div className="flex flex-wrap items-start gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-slide-down">
          {advancedFilters.map(renderFilter)}
        </div>
      )}
    </form>
  );
}
